# The Spark of Inspiration

It started with a simple observation in a rural classroom. I watched a room full of bright-eyed six-year-olds struggle through a rote English lesson—repeating words they didn't understand, taught by an overwhelmed teacher managing 60 students. But during lunch break, those same children huddled around a cracked smartphone, laughing hysterically at Shinchan's antics, perfectly mimicking his dialogues.

That contrast haunted me: *Why do children memorize cartoon dialogues effortlessly but struggle with basic literacy?*

The answer was obvious—**emotional connection**. Children don't learn from Shinchan because he's educational. They learn because they *love* him.

This sparked the core question behind Tooni: **What if children could actually *talk* to their favorite cartoon characters—and learn English in the process?**

---

# Overview

Tooni uses generative AI to transform English learning for children by letting them have real-time voice conversations with their favorite cartoon characters—Shinchan and Bluey. We combine **Google Gemini's Live API** for real-time conversational intelligence with **ElevenLabs' voice synthesis** to create authentic, character-accurate voices that kids instantly recognize and love.

<div align="center">
<img src="https://github.com/user-attachments/assets/demo-screenshot" alt="Tooni Demo" width="600"/>
</div>

The app consists of 3 core AI features:

1. **Real-Time Voice Conversations**: Children can speak naturally with AI-powered cartoon characters. Google Gemini processes speech input and generates contextually appropriate responses, maintaining each character's unique personality—Shinchan is funny and mischievous, while Bluey is playful and curious.

2. **Authentic Character Voices (ElevenLabs)**: We use ElevenLabs' voice cloning and synthesis technology to create voices that sound exactly like the original cartoon characters. This isn't generic text-to-speech—children hear Shinchan's distinctive voice and Bluey's Australian accent, making the experience feel like they're actually talking to their favorite characters.

3. **Animated Interactive Avatars**: Custom SVG characters come to life with real-time animations. The avatars' mouths move in sync with their speech, they blink naturally, and their bodies bounce playfully. Visual indicators show children when the character is listening, speaking, or muted.

Our goal with Tooni is to make English learning feel like playtime. By combining cutting-edge conversational AI with authentic character voices, we create a magical experience where children practice speaking English without the anxiety of human judgment—they're just chatting with their animated friends.

**Problems we're solving**: Children learning English often struggle with:
- **Speaking anxiety**: Fear of making mistakes in front of teachers or peers
- **Lack of practice partners**: Limited opportunities for conversational English practice
- **Boring learning materials**: Traditional methods fail to engage young learners
- **Accessibility**: Quality English tutoring is expensive and not universally available
- **Engagement**: Generic AI voices don't capture children's attention or imagination

We address these problems by providing an always-available, patient, and fun conversation partner that children actually *want* to talk to—with voices they recognize and trust.

---

# How it works (technical overview)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    TOONI ARCHITECTURE                                │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   Child's Device │
│   (Browser/PWA)  │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React + TypeScript)                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ Character       │  │ Animated Avatar │  │ Audio Pipeline  │  │ Error Handler  │  │
│  │ Selection UI    │  │ (SVG + CSS)     │  │ (Web Audio API) │  │ + PWA Support  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
         │                                           │
         │ Character Config                          │ Audio Stream
         │ (personality, voice ID)                   │ (16kHz PCM)
         ▼                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                 AUDIO PROCESSING LAYER                               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  • Microphone capture via getUserMedia()                                     │    │
│  │  • Noise gate filtering (threshold: 0.01) - removes background noise         │    │
│  │  • Real-time resampling: Device rate → 16kHz (linear interpolation)          │    │
│  │  • PCM encoding for API transmission                                         │    │
│  │  • Echo cancellation + auto gain control                                     │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────┘
         │                                           │
         │ Processed Speech                          │ Text Response
         ▼                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              AI & VOICE SERVICES                                     │
│                                                                                      │
│  ┌─────────────────────────────────┐    ┌─────────────────────────────────────┐     │
│  │      GOOGLE GEMINI LIVE API     │    │         ELEVENLABS VOICE API        │     │
│  │         (Conversational AI)     │    │      (Character Voice Synthesis)    │     │
│  │  ┌───────────────────────────┐  │    │  ┌───────────────────────────────┐  │     │
│  │  │ • Model: gemini-2.5-flash │  │    │  │ • Custom voice clones for     │  │     │
│  │  │ • WebSocket connection    │  │    │  │   each cartoon character      │  │     │
│  │  │ • Real-time streaming     │  │    │  │                               │  │     │
│  │  │ • Character personalities:│  │    │  │ • Shinchan: Playful child     │  │     │
│  │  │                           │  │    │  │   voice with Japanese accent  │  │     │
│  │  │   SHINCHAN:               │  │    │  │                               │  │     │
│  │  │   - 5-year-old persona    │  │    │  │ • Bluey: Energetic Australian │  │     │
│  │  │   - Funny & mischievous   │  │    │  │   puppy voice                 │  │     │
│  │  │   - Uses "Oho!", "Hey!"   │  │    │  │                               │  │     │
│  │  │                           │  │    │  │ • Low-latency streaming TTS   │  │     │
│  │  │   BLUEY:                  │  │    │  │ • Emotion-aware synthesis     │  │     │
│  │  │   - 6-year-old puppy      │  │    │  │ • Natural prosody & pacing    │  │     │
│  │  │   - Playful & curious     │  │──────▶│                               │  │     │
│  │  │   - Australian accent     │  │ Text │ └───────────────────────────────┘  │     │
│  │  │   - Uses "G'day!"         │  │      │               │                    │     │
│  │  └───────────────────────────┘  │      │               │ Character Voice    │     │
│  └─────────────────────────────────┘      │               ▼ (24kHz Audio)      │     │
│                                           └─────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                                     │
                                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              AUDIO OUTPUT PIPELINE                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  • Decode base64 audio to PCM                                                │    │
│  │  • Schedule gapless playback via Web Audio API                               │    │
│  │  • Real-time volume analysis for avatar lip-sync                             │    │
│  │  • Output: 24kHz audio to device speakers                                    │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              AVATAR ANIMATION SYSTEM                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐       │
│  │   Lip Sync           │  │   Natural Behaviors  │  │   Status Indicators  │       │
│  │   mouthOpen =        │  │   • Random blinks    │  │   • 🟢 Listening     │       │
│  │   5 + (volume × 25)  │  │     (2.5-4.5s)       │  │   • 🔵 Speaking      │       │
│  │                      │  │   • Body bounce      │  │   • 🟡 Muted         │       │
│  │                      │  │     (±3px, 0.5s)     │  │                      │       │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Character Selection & Session Initialization

When a child opens Tooni, they choose between Shinchan or Bluey. Each character has a distinct personality powered by Gemini and an authentic voice powered by ElevenLabs.

<div align="center">
<img src="https://github.com/user-attachments/assets/character-select" alt="Character Selection" width="500"/>
</div>

## Real-Time Conversational AI (Google Gemini)

The conversational intelligence is powered by Google's Gemini 2.5 Flash Live API, which enables real-time, streaming conversations.

To accomplish this:

1. **Audio Capture**: We use the Web Audio API with `getUserMedia()` to capture microphone input. The audio is processed through a `ScriptProcessorNode` for real-time streaming.

2. **Intelligent Noise Gating**: A noise gate (threshold: 0.01 amplitude) filters out background noise, ensuring only actual speech is sent to the API. This prevents the AI from being triggered by ambient sounds.

3. **Audio Resampling**: Input audio is resampled from the device's native sample rate to 16kHz using linear interpolation, optimizing it for speech recognition.

4. **Gemini Live API Connection**: We establish a WebSocket connection to `gemini-2.5-flash-native-audio-preview` with streaming audio mode. Each character has custom system instructions:
   - **Shinchan**: A funny 5-year-old who uses simple words, makes jokes, and loves Action Kamen
   - **Bluey**: A playful Australian puppy who's curious, encouraging, and loves games

5. **Context Maintenance**: Gemini maintains conversation context, remembering what the child said earlier and responding appropriately to follow-up questions or comments.

## Authentic Character Voices (ElevenLabs)

The magic of Tooni comes from voices that children instantly recognize. We use ElevenLabs' voice synthesis to create authentic character voices.

<div align="center">
<img src="https://github.com/user-attachments/assets/elevenlabs-voice" alt="ElevenLabs Voice Integration" width="600"/>
</div>

To accomplish this:

1. **Custom Voice Clones**: We create voice profiles for each character using ElevenLabs' voice cloning technology, capturing the unique characteristics of Shinchan's childlike Japanese-accented voice and Bluey's energetic Australian puppy voice.

2. **Text-to-Speech Pipeline**: Gemini's text response is sent to ElevenLabs' streaming TTS API, which generates audio in the character's voice with natural prosody, emotion, and pacing.

3. **Low-Latency Streaming**: ElevenLabs' streaming API delivers audio chunks as they're generated, minimizing the delay between Gemini's response and the character "speaking."

4. **Emotion-Aware Synthesis**: The voice synthesis adapts to the emotional context of the response—excited when playing games, gentle when correcting mistakes, encouraging when the child does well.

## Animated Avatar System

The characters aren't static images—they're fully animated SVG graphics that respond to the conversation in real-time.

To accomplish this:

1. **Volume-Responsive Mouth Animation**: The avatar's mouth opening is calculated as `5 + volume * 25`, creating natural lip-sync with the character's speech.

2. **Natural Blinking**: Random blink intervals (2.5-4.5 seconds) make the characters feel alive.

3. **Body Animation**: A subtle bounce animation (±3px, 0.5s cycle) gives the characters energy and presence.

4. **Status Indicators**: Visual cues show the current state:
   - Green glow: Listening to the child
   - Blue glow: Character is speaking
   - Amber glow: Microphone is muted

## Progressive Web App (PWA)

Tooni works offline and can be installed on any device like a native app.

- **Service Worker Caching**: Assets are cached for offline access using a cache-first strategy
- **Home Screen Installation**: Children can add Tooni to their home screen for quick access
- **Standalone Mode**: When installed, Tooni runs fullscreen without browser UI

---

# Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19, TypeScript, Tailwind CSS | UI components and styling |
| **Conversational AI** | Google Gemini 2.5 Flash Live API | Real-time speech understanding and response generation |
| **Voice Synthesis** | ElevenLabs API | Authentic character voice cloning and TTS |
| **Audio Processing** | Web Audio API | Capture (16kHz), playback (24kHz), noise gating |
| **Build** | Vite 6.2 | Fast development and production builds |
| **PWA** | Service Workers, Web App Manifest | Offline support and installability |

---

# Run Locally

**Prerequisites:** Node.js 18+

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tooni.git
   cd tooni
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set your API keys in `.env.local`:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ```

4. Run the app:
   ```bash
   npm run dev
   ```

5. Open `http://localhost:5173` in your browser

---

# What's next / Feedback

We loved building Tooni with the Gemini Live API and ElevenLabs Voice API. Here are some features and improvements we'd love to explore:

**ElevenLabs Integration Enhancements:**

1. **Voice Emotion Mapping**: Deeper integration with ElevenLabs' emotion parameters to have character voices dynamically adjust based on conversation context (excited during games, calm during teaching moments).

2. **More Character Voices**: Expanding the roster with more beloved cartoon characters, each with their own cloned voice—imagine learning English with Dora, SpongeBob, or Peppa Pig.

3. **Pronunciation Feedback**: Using ElevenLabs' voice analysis to compare the child's pronunciation with the character's, providing gentle corrections in the character's voice.

**Platform Improvements:**

4. **Multi-language Support**: Adding support for children learning other languages, with characters adapting their teaching style and ElevenLabs generating appropriate accents.

5. **Learning Progress Tracking**: Vocabulary tracking, pronunciation scores, and progress reports for parents to see their child's improvement over time.

6. **Structured Lessons**: While free conversation is great for practice, guided lessons around specific topics (colors, numbers, daily routines) would add educational structure.

7. **Parental Controls**: Screen time limits, conversation history review, and content filtering options for parents.

---

# Team

Built with love for the next generation of English learners.
