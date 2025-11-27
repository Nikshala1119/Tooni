import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionState } from '../types';
import { base64ToBytes, createPcmBlob, decodeAudioData, resampleAudio } from '../utils/audioUtils';

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

export function useLiveSession(character: Character = 'shinchan') {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [volume, setVolume] = useState(0);
  const [isTalking, setIsTalking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null); // Type as 'any' or Session if available in types
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isMutedRef = useRef<boolean>(false);

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

    setConnectionState(ConnectionState.DISCONNECTED);
    setIsTalking(false);
    setVolume(0);
    setIsMuted(false);
  }, []);

  const connect = useCallback(async () => {
    if (connectionState === ConnectionState.CONNECTING || connectionState === ConnectionState.CONNECTED) return;
    
    setConnectionState(ConnectionState.CONNECTING);

    try {
      // 1. Setup Audio Output Context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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

      // Volume monitoring loop
      const updateVolume = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        // Normalize 0-255 to 0-1, apply some threshold
        const normVol = Math.min(1, average / 100);
        
        setVolume(normVol);
        setIsTalking(normVol > 0.1);

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

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream; // Store stream reference for cleanup
      const source = inputCtx.createMediaStreamSource(stream);
      const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);

      source.connect(scriptProcessor);
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

                // Start pumping audio from mic (only when not muted)
                let audioSendCount = 0;
                scriptProcessor.onaudioprocess = (e) => {
                    // Skip sending audio if muted
                    if (isMutedRef.current) return;

                    const inputData = e.inputBuffer.getChannelData(0);

                    // Resample from input sample rate to 16kHz
                    const resampledData = resampleAudio(inputData, inputSampleRate, targetSampleRate);

                    // Check if there's actual audio (not just silence)
                    let maxVal = 0;
                    for (let i = 0; i < resampledData.length; i++) {
                        const absVal = Math.abs(resampledData[i]);
                        if (absVal > maxVal) maxVal = absVal;
                    }

                    // Log every 50th chunk to avoid spam
                    audioSendCount++;
                    if (audioSendCount % 50 === 0) {
                        console.log(`Sending audio chunk #${audioSendCount}, max amplitude: ${maxVal.toFixed(4)}, samples: ${resampledData.length}`);
                    }

                    const pcmBlob = createPcmBlob(resampledData);
                    sessionPromise.then(session => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
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
                        bufferSource.connect(analyserRef.current); // Connect to analyser (which connects to destination)

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

                // Handle Interruption
                if (message.serverContent?.interrupted) {
                   console.log("Response interrupted by user");
                   audioSourcesRef.current.forEach(s => s.stop());
                   audioSourcesRef.current.clear();
                   nextStartTimeRef.current = 0;
                }
            },
            onclose: () => {
                cleanup();
            },
            onerror: (e) => {
                console.error("Live API Error", e);
                setConnectionState(ConnectionState.ERROR);
                cleanup();
            }
        }
      });
      
      sessionRef.current = await sessionPromise;

    } catch (error) {
      console.error("Connection failed", error);
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
    volume,
    isTalking,
    isMuted,
    toggleMute,
  };
}