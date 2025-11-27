import React, { useState } from 'react';
import CartoonAvatar from './components/CartoonAvatar';
import BlueyAvatar from './components/BlueyAvatar';
import InstallPrompt from './components/InstallPrompt';
import { useLiveSession, Character } from './hooks/useLiveSession';
import { ConnectionState } from './types';

export default function App() {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const { connect, disconnect, connectionState, volume, isTalking, isMuted, toggleMute } = useLiveSession(selectedCharacter || 'shinchan');
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacter(character);
  };

  const handleStart = () => {
    setHasInteracted(true);
    connect();
  };

  const handleStop = () => {
    disconnect();
    setSelectedCharacter(null); // Go back to character selection
  };

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;
  const isError = connectionState === ConnectionState.ERROR;

  const bgGradient = selectedCharacter === 'bluey'
    ? 'from-blue-100 to-cyan-100'
    : 'from-yellow-100 to-orange-100';

  const accentColor = selectedCharacter === 'bluey' ? 'blue' : 'orange';
  const characterName = selectedCharacter === 'bluey' ? 'Bluey' : 'Shinchan';

  // Character selection screen
  if (!selectedCharacter) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-purple-100 to-pink-100 flex flex-col items-center justify-center p-3 sm:p-4 relative overflow-hidden font-sans">
        {/* Decorative Background Elements - smaller on mobile */}
        <div className="absolute top-5 sm:top-10 left-5 sm:left-10 w-16 sm:w-24 h-16 sm:h-24 bg-purple-300 rounded-full opacity-50 blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-20 w-20 sm:w-32 h-20 sm:h-32 bg-pink-300 rounded-full opacity-50 blur-xl animate-pulse delay-700"></div>

        <div className="z-10 flex flex-col items-center w-full max-w-2xl px-2 sm:px-4">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-purple-600 tracking-tight drop-shadow-sm">
              Tooni
            </h1>
            <p className="text-purple-800 mt-1 sm:mt-2 text-xs sm:text-sm md:text-base font-medium opacity-80 px-4">
              Learn English with your favorite cartoon friends!
            </p>
          </div>

          <div className="flex flex-row sm:flex-col md:flex-row gap-3 sm:gap-6 md:gap-8 w-full justify-center items-center">
            {/* Shinchan Card */}
            <button
              onClick={() => handleSelectCharacter('shinchan')}
              className="group bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-3 sm:p-5 md:p-6 shadow-lg border-4 border-transparent hover:border-orange-400 active:border-orange-400 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-xl w-36 sm:w-56 md:w-64"
            >
              <div className="w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 mx-auto mb-2 sm:mb-4 overflow-hidden">
                <img src="/main.png" alt="Shinchan" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 mb-1 sm:mb-2">Shinchan</h2>
              <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">Funny and mischievous 5-year-old from Japan</p>
            </button>

            {/* Bluey Card */}
            <button
              onClick={() => handleSelectCharacter('bluey')}
              className="group bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-3 sm:p-5 md:p-6 shadow-lg border-4 border-transparent hover:border-blue-400 active:border-blue-400 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-xl w-36 sm:w-56 md:w-64"
            >
              <div className="w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 mx-auto mb-2 sm:mb-4 overflow-hidden flex items-center justify-center">
                <svg viewBox="0 0 348 528" className="w-full h-full">
                  <image href="/bluey.svg" width="348" height="528" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 mb-1 sm:mb-2">Bluey</h2>
              <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">Playful and imaginative puppy from Australia</p>
            </button>
          </div>
        </div>

        {/* PWA Install Prompt */}
        <InstallPrompt />
      </div>
    );
  }

  return (
    <div className={`min-h-screen min-h-[100dvh] bg-gradient-to-b ${bgGradient} flex flex-col items-center justify-center p-3 sm:p-4 relative overflow-hidden font-sans`}>

      {/* Decorative Background Elements */}
      <div className={`absolute top-5 sm:top-10 left-5 sm:left-10 w-16 sm:w-24 h-16 sm:h-24 bg-${accentColor}-300 rounded-full opacity-50 blur-xl animate-pulse`}></div>
      <div className={`absolute bottom-10 sm:bottom-20 right-5 sm:right-20 w-20 sm:w-32 h-20 sm:h-32 bg-${accentColor === 'blue' ? 'cyan' : 'red'}-300 rounded-full opacity-50 blur-xl animate-pulse delay-700`}></div>

      <div className="z-10 flex flex-col items-center w-full max-w-md px-2 sm:px-0">

        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
            <h1 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-${accentColor}-600 tracking-tight drop-shadow-sm`}>
                {characterName}'s English Class
            </h1>
            <p className={`text-${accentColor}-800 mt-1 sm:mt-2 text-sm sm:text-base font-medium opacity-80`}>
                Let's practice together!
            </p>
        </div>

        {/* Character Stage */}
        <div className="relative mb-6 sm:mb-8 md:mb-12">
           {selectedCharacter === 'bluey' ? (
             <BlueyAvatar
               volume={volume}
               isTalking={isTalking}
               isListening={isConnected && !isTalking}
               isConnected={isConnected || isConnecting}
               isMuted={isMuted}
             />
           ) : (
             <CartoonAvatar
               volume={volume}
               isTalking={isTalking}
               isListening={isConnected && !isTalking}
               isConnected={isConnected || isConnecting}
               isMuted={isMuted}
             />
           )}

           {/* Speech Bubble / Status */}
           {isConnected && isTalking && (
                <div className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl rounded-bl-none shadow-md border-2 border-slate-100 animate-bounce">
                    <span className="text-xl sm:text-2xl">🎵</span>
                </div>
           )}
        </div>

        {/* Controls */}
        <div className="w-full flex flex-col items-center gap-3 sm:gap-4">
            {!isConnected && !isConnecting && (
                <button
                    onClick={handleStart}
                    className="group relative inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 font-bold text-white text-sm sm:text-base transition-all duration-200 bg-green-500 rounded-full shadow-lg hover:bg-green-600 hover:scale-105 active:scale-95 hover:shadow-green-500/30 focus:outline-none ring-offset-2 focus:ring-2 ring-green-400"
                >
                    <span className="mr-2 text-xl sm:text-2xl">📞</span>
                    Call {characterName}
                    <div className="absolute inset-0 rounded-full ring-4 ring-white/20 group-hover:ring-white/40 transition-all"></div>
                </button>
            )}

            {isConnecting && (
                 <button disabled className="px-6 sm:px-8 py-3 sm:py-4 bg-gray-300 text-gray-600 text-sm sm:text-base font-bold rounded-full cursor-wait flex items-center shadow-inner">
                    <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                 </button>
            )}

            {isConnected && (
                <div className="flex gap-2 sm:gap-3">
                    <button
                        onClick={toggleMute}
                        className={`px-4 sm:px-6 py-3 sm:py-4 font-bold text-white transition-all duration-200 rounded-full shadow-lg hover:scale-105 active:scale-95 focus:outline-none ring-offset-2 focus:ring-2 ${
                            isMuted
                                ? 'bg-yellow-500 hover:bg-yellow-600 ring-yellow-400'
                                : 'bg-blue-500 hover:bg-blue-600 ring-blue-400'
                        }`}
                    >
                        <span className="text-lg sm:text-xl">{isMuted ? '🔇' : '🎤'}</span>
                    </button>
                    <button
                        onClick={handleStop}
                        className="px-5 sm:px-8 py-3 sm:py-4 font-bold text-white text-sm sm:text-base transition-all duration-200 bg-red-500 rounded-full shadow-lg hover:bg-red-600 hover:scale-105 active:scale-95 focus:outline-none ring-offset-2 focus:ring-2 ring-red-400"
                    >
                        <span className="mr-1 sm:mr-2 text-lg sm:text-xl">🛑</span>
                        End Call
                    </button>
                </div>
            )}

            {isError && (
                <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-red-100 text-red-700 rounded-lg text-xs sm:text-sm font-semibold border border-red-200">
                    Oops! Something went wrong. Try again.
                </div>
            )}
        </div>

        {/* Instructions */}
        <div className="mt-6 sm:mt-8 md:mt-12 p-4 sm:p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 w-full">
            <h3 className={`text-base sm:text-lg font-bold text-${accentColor}-800 mb-2`}>How to play:</h3>
            <ul className="list-disc list-inside text-slate-700 space-y-1 text-xs sm:text-sm">
                <li>Click the <span className="font-bold text-green-600">Call</span> button.</li>
                <li>Say <span className="italic">"Hello {characterName}!"</span></li>
                <li>Practice simple English words with {selectedCharacter === 'bluey' ? 'her' : 'him'}.</li>
                <li>Have fun!</li>
            </ul>
        </div>
      </div>

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}