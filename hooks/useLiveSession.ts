import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionState, ErrorType } from '../types';
import { base64ToBytes, createPcmBlob, decodeAudioData, resampleAudio } from '../utils/audioUtils';

// Helper function to detect error type from various error sources
function detectErrorType(error: unknown): ErrorType {
  if (!error) return ErrorType.UNKNOWN;

  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const errorName = error instanceof Error ? error.name : '';

  // Microphone permission errors
  if (errorName === 'NotAllowedError' || errorMessage.includes('permission denied') || errorMessage.includes('not allowed')) {
    return ErrorType.MIC_PERMISSION_DENIED;
  }

  // Microphone not found
  if (errorName === 'NotFoundError' || errorMessage.includes('not found') || errorMessage.includes('no device')) {
    return ErrorType.MIC_NOT_FOUND;
  }

  // Browser not supported
  if (errorName === 'NotSupportedError' || errorMessage.includes('not supported') || errorMessage.includes('mediadevices')) {
    return ErrorType.BROWSER_NOT_SUPPORTED;
  }

  // API key issues
  if (errorMessage.includes('api key') || errorMessage.includes('apikey') || errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
    return ErrorType.API_KEY_MISSING;
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('offline') || errorName === 'TypeError') {
    return ErrorType.NETWORK_ERROR;
  }

  // Connection/API errors
  if (errorMessage.includes('connect') || errorMessage.includes('websocket') || errorMessage.includes('socket')) {
    return ErrorType.API_CONNECTION_FAILED;
  }

  return ErrorType.UNKNOWN;
}

export type Character = 'shinchan' | 'bluey';

const CHARACTER_CONFIG = {
  shinchan: {
    systemInstruction: "You are Shinchan Nohara, a 5-year-old kindergarten boy. You are funny, energetic, and slightly mischievous but very kind. You are helping a user (who is a friend) practice English. Speak in simple, short sentences suitable for a beginner or a child. If the user makes a mistake, gently correct them in a funny way. Do not be rude, just playful. Use words like 'Oho!', 'Hey hey!'. Keep responses concise.",
    voiceName: 'Kore',
    greeting: 'Hello! Greet me as Shinchan!'
  },
  bluey: {
    systemInstruction: "You are Bluey Heeler, a 6-year-old Blue Heeler puppy from Brisbane, Australia. You are imaginative, playful, and love games. You are helping a user (who is a friend) practice English. Speak in simple, enthusiastic sentences. Be curious and ask questions about what games the user likes. Use Australian expressions occasionally like 'G'day!' or 'No worries!'. If the user makes a mistake, help them kindly. Keep responses fun and concise.",
    voiceName: 'Puck',
    greeting: 'Hello! Greet me as Bluey the puppy!'
  }
};

// Audio configuration constants
const NOISE_GATE_THRESHOLD = 0.01; // Minimum amplitude to send audio (filters background noise)
const INPUT_LEVEL_SMOOTHING = 0.3; // Smoothing factor for input level visualization

export function useLiveSession(character: Character = 'shinchan') {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [errorType, setErrorType] = useState<ErrorType>(ErrorType.NONE); // Track specific error type
  const [volume, setVolume] = useState(0); // Output volume (character speaking)
  const [inputLevel, setInputLevel] = useState(0); // Input volume (user's mic level)
  const [isTalking, setIsTalking] = useState(false); // Character is speaking
  const [isMuted, setIsMuted] = useState(false);
  const [isGreetingComplete, setIsGreetingComplete] = useState(false); // Track if character finished greeting

  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const analyserRef = useRef<AnalyserNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null); // Analyser for mic input
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isMutedRef = useRef<boolean>(false);
  const isGreetingCompleteRef = useRef<boolean>(false); // Ref for use in callbacks
  const smoothedInputLevelRef = useRef<number>(0); // For smoothing input level

  const cleanup = useCallback(() => {
    // Stop all audio sources
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    audioSourcesRef.current.clear();

    // Stop media stream (microphone)
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Close session
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }

    // Close audio contexts
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }

    // Stop animation loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Reset input analyser
    inputAnalyserRef.current = null;

    setConnectionState(ConnectionState.DISCONNECTED);
    setIsTalking(false);
    setVolume(0);
    setInputLevel(0);
    setIsMuted(false);
    setIsGreetingComplete(false);
    isGreetingCompleteRef.current = false;
    smoothedInputLevelRef.current = 0;
    // Don't reset errorType here - let it persist so UI can show the error
  }, []);

  // Function to clear error and reset state
  const clearError = useCallback(() => {
    setErrorType(ErrorType.NONE);
    setConnectionState(ConnectionState.DISCONNECTED);
  }, []);

  const connect = useCallback(async () => {
    if (connectionState === ConnectionState.CONNECTING || connectionState === ConnectionState.CONNECTED) return;

    // Clear any previous error
    setErrorType(ErrorType.NONE);
    setConnectionState(ConnectionState.CONNECTING);

    try {
      // Check browser compatibility first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw Object.assign(new Error('Browser does not support media devices'), { name: 'NotSupportedError' });
      }

      // Check if online
      if (!navigator.onLine) {
        throw new Error('network offline');
      }

      // 1. Setup Audio Output Context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw Object.assign(new Error('AudioContext not supported'), { name: 'NotSupportedError' });
      }
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      // Resume audio context if suspended (browser autoplay policy)
      if (outputCtx.state === 'suspended') {
        await outputCtx.resume();
      }

      // Analyser for visualization
      const analyser = outputCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      analyser.connect(outputCtx.destination);

      // Volume monitoring loop for both input and output
      const updateVolume = () => {
        // Output volume (character speaking)
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const normVol = Math.min(1, average / 100);

          setVolume(normVol);
          setIsTalking(normVol > 0.1);
        }

        // Input volume (user's microphone) - with smoothing for stable visualization
        if (inputAnalyserRef.current) {
          const inputDataArray = new Uint8Array(inputAnalyserRef.current.frequencyBinCount);
          inputAnalyserRef.current.getByteFrequencyData(inputDataArray);

          let inputSum = 0;
          for (let i = 0; i < inputDataArray.length; i++) {
            inputSum += inputDataArray[i];
          }
          const inputAverage = inputSum / inputDataArray.length;
          const rawInputLevel = Math.min(1, inputAverage / 80); // Slightly more sensitive

          // Apply smoothing to prevent jumpy visualization
          smoothedInputLevelRef.current =
            smoothedInputLevelRef.current * (1 - INPUT_LEVEL_SMOOTHING) +
            rawInputLevel * INPUT_LEVEL_SMOOTHING;

          setInputLevel(smoothedInputLevelRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // 2. Setup Audio Input (use default sample rate, we'll resample later)
      const inputCtx = new AudioContextClass();
      inputAudioContextRef.current = inputCtx;
      console.log(`Input AudioContext sample rate: ${inputCtx.sampleRate}Hz`);

      // Resume input context if suspended
      if (inputCtx.state === 'suspended') {
        await inputCtx.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      mediaStreamRef.current = stream;
      const source = inputCtx.createMediaStreamSource(stream);

      // Create input analyser for mic level visualization
      const inputAnalyser = inputCtx.createAnalyser();
      inputAnalyser.fftSize = 256;
      inputAnalyserRef.current = inputAnalyser;
      source.connect(inputAnalyser);

      const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
      inputAnalyser.connect(scriptProcessor);
      scriptProcessor.connect(inputCtx.destination);

      // Calculate resampling ratio
      const inputSampleRate = inputCtx.sampleRate;
      const targetSampleRate = 16000;

      // 3. Initialize Gemini
      if (!process.env.API_KEY) {
          throw new Error("API Key not found");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // 4. Connect to Live API
      const config = CHARACTER_CONFIG[character];
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voiceName } }
            },
            systemInstruction: config.systemInstruction
        },
        callbacks: {
            onopen: () => {
                console.log("Connected to Gemini Live API");
                setConnectionState(ConnectionState.CONNECTED);

                // Send initial greeting to make character speak first
                sessionPromise.then(session => {
                    session.sendClientContent({
                        turns: [{ role: 'user', parts: [{ text: config.greeting }] }],
                        turnComplete: true
                    });
                    console.log("Sent initial greeting prompt for", character);
                });

                // Start pumping audio from mic with noise gate and greeting protection
                let audioSendCount = 0;
                let debugLogCount = 0;
                scriptProcessor.onaudioprocess = (e) => {
                    debugLogCount++;

                    // Skip sending audio if muted
                    if (isMutedRef.current) {
                        if (debugLogCount % 100 === 0) console.log('[Audio] Skipped - muted');
                        return;
                    }

                    // Skip sending audio until character finishes greeting
                    if (!isGreetingCompleteRef.current) {
                        if (debugLogCount % 100 === 0) console.log('[Audio] Skipped - waiting for greeting');
                        return;
                    }

                    const inputData = e.inputBuffer.getChannelData(0);

                    // Resample from input sample rate to 16kHz
                    const resampledData = resampleAudio(inputData, inputSampleRate, targetSampleRate);

                    // NOISE GATE: Calculate max amplitude and skip if below threshold
                    let maxVal = 0;
                    for (let i = 0; i < resampledData.length; i++) {
                        const absVal = Math.abs(resampledData[i]);
                        if (absVal > maxVal) maxVal = absVal;
                    }

                    // Log amplitude periodically for debugging
                    if (debugLogCount % 50 === 0) {
                        console.log(`[Audio] Max amplitude: ${maxVal.toFixed(4)}, threshold: ${NOISE_GATE_THRESHOLD}, greeting complete: ${isGreetingCompleteRef.current}`);
                    }

                    // Filter out background noise - only send audio above threshold
                    if (maxVal < NOISE_GATE_THRESHOLD) {
                        return; // Don't send quiet/background noise
                    }

                    // Log audio being sent
                    audioSendCount++;
                    if (audioSendCount % 10 === 0) {
                        console.log(`[Audio] Sending chunk #${audioSendCount}, amplitude: ${maxVal.toFixed(4)}`);
                    }

                    const pcmBlob = createPcmBlob(resampledData);

                    // Use sessionRef if available, otherwise fall back to sessionPromise
                    if (sessionRef.current) {
                        try {
                            sessionRef.current.sendRealtimeInput({ media: pcmBlob });
                        } catch (err) {
                            console.error('[Audio] Failed to send via sessionRef:', err);
                        }
                    } else {
                        sessionPromise.then(session => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        }).catch(err => {
                            console.error('[Audio] Failed to send via promise:', err);
                        });
                    }
                };
            },
            onmessage: async (message: LiveServerMessage) => {
                console.log("Received message from API:", message);

                // Handle Audio Output
                const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (audioData && audioContextRef.current && analyserRef.current) {
                    const ctx = audioContextRef.current;

                    // Ensure audio context is running
                    if (ctx.state === 'suspended') {
                        await ctx.resume();
                    }

                    try {
                        const audioBuffer = await decodeAudioData(
                            base64ToBytes(audioData),
                            ctx,
                            24000,
                            1
                        );

                        const bufferSource = ctx.createBufferSource();
                        bufferSource.buffer = audioBuffer;
                        bufferSource.connect(analyserRef.current);

                        // Scheduling
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                        bufferSource.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;

                        audioSourcesRef.current.add(bufferSource);
                        bufferSource.onended = () => {
                            audioSourcesRef.current.delete(bufferSource);
                        };
                        console.log("Audio scheduled for playback");
                    } catch (err) {
                        console.error("Error decoding/playing audio:", err);
                    }
                }

                // Detect when character finishes speaking (turn complete)
                // This enables user mic input after the greeting
                if (message.serverContent?.turnComplete) {
                    console.log("Character finished speaking, enabling user input");
                    if (!isGreetingCompleteRef.current) {
                        isGreetingCompleteRef.current = true;
                        setIsGreetingComplete(true);
                    }
                }

                // Handle Interruption
                if (message.serverContent?.interrupted) {
                   console.log("Response interrupted by user");
                   audioSourcesRef.current.forEach(s => s.stop());
                   audioSourcesRef.current.clear();
                   nextStartTimeRef.current = 0;
                }
            },
            onclose: () => {
                console.log("Session closed");
                // Only set error if we were connected (unexpected close)
                if (connectionState === ConnectionState.CONNECTED) {
                    setErrorType(ErrorType.SESSION_ENDED);
                    setConnectionState(ConnectionState.ERROR);
                }
                cleanup();
            },
            onerror: (e) => {
                console.error("Live API Error", e);
                const detectedError = detectErrorType(e);
                setErrorType(detectedError === ErrorType.UNKNOWN ? ErrorType.API_CONNECTION_FAILED : detectedError);
                setConnectionState(ConnectionState.ERROR);
                cleanup();
            }
        }
      });
      
      sessionRef.current = await sessionPromise;

    } catch (error) {
      console.error("Connection failed", error);
      const detectedError = detectErrorType(error);
      setErrorType(detectedError);
      setConnectionState(ConnectionState.ERROR);
      cleanup();
    }
  }, [connectionState, cleanup, character]);

  const toggleMute = useCallback(() => {
    const newMutedState = !isMutedRef.current;
    isMutedRef.current = newMutedState;
    setIsMuted(newMutedState);
  }, []);

  return {
    connect,
    disconnect: cleanup,
    connectionState,
    errorType,
    clearError,
    volume,
    inputLevel,
    isTalking,
    isMuted,
    isGreetingComplete,
    toggleMute,
  };
}