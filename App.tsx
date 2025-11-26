import React, { useState } from 'react';
import CartoonAvatar from './components/CartoonAvatar';
import { useLiveSession } from './hooks/useLiveSession';
import { ConnectionState } from './types';

export default function App() {
  const { connect, disconnect, connectionState, volume, isTalking, isMuted, toggleMute } = useLiveSession();
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleStart = () => {
    setHasInteracted(true);
    connect();
  };

  const handleStop = () => {
    disconnect();
  };

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;
  const isError = connectionState === ConnectionState.ERROR;

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-orange-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-yellow-300 rounded-full opacity-50 blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-red-300 rounded-full opacity-50 blur-xl animate-pulse delay-700"></div>

      <div className="z-10 flex flex-col items-center w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-orange-600 tracking-tight drop-shadow-sm">
                Shinchan's English Class
            </h1>
            <p className="text-orange-800 mt-2 font-medium opacity-80">
                Let's practice together!
            </p>
        </div>

        {/* Character Stage */}
        <div className="relative mb-12">
           <CartoonAvatar
             volume={volume}
             isTalking={isTalking}
             isListening={isConnected && !isTalking}
             isConnected={isConnected || isConnecting}
             isMuted={isMuted}
           />
           
           {/* Speech Bubble / Status */}
           {isConnected && isTalking && (
                <div className="absolute -top-4 -right-4 bg-white px-4 py-2 rounded-2xl rounded-bl-none shadow-md border-2 border-slate-100 animate-bounce">
                    <span className="text-2xl">🎵</span>
                </div>
           )}
        </div>

        {/* Controls */}
        <div className="w-full flex flex-col items-center gap-4">
            {!isConnected && !isConnecting && (
                <button 
                    onClick={handleStart}
                    className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-green-500 font-lg rounded-full shadow-lg hover:bg-green-600 hover:scale-105 hover:shadow-green-500/30 focus:outline-none ring-offset-2 focus:ring-2 ring-green-400"
                >
                    <span className="mr-2 text-2xl">📞</span>
                    Call Shinchan
                    <div className="absolute inset-0 rounded-full ring-4 ring-white/20 group-hover:ring-white/40 transition-all"></div>
                </button>
            )}

            {isConnecting && (
                 <button disabled className="px-8 py-4 bg-gray-300 text-gray-600 font-bold rounded-full cursor-wait flex items-center shadow-inner">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                 </button>
            )}

            {isConnected && (
                <div className="flex gap-3">
                    <button
                        onClick={toggleMute}
                        className={`px-6 py-4 font-bold text-white transition-all duration-200 rounded-full shadow-lg hover:scale-105 focus:outline-none ring-offset-2 focus:ring-2 ${
                            isMuted
                                ? 'bg-yellow-500 hover:bg-yellow-600 ring-yellow-400'
                                : 'bg-blue-500 hover:bg-blue-600 ring-blue-400'
                        }`}
                    >
                        <span className="text-xl">{isMuted ? '🔇' : '🎤'}</span>
                    </button>
                    <button
                        onClick={handleStop}
                        className="px-8 py-4 font-bold text-white transition-all duration-200 bg-red-500 rounded-full shadow-lg hover:bg-red-600 hover:scale-105 focus:outline-none ring-offset-2 focus:ring-2 ring-red-400"
                    >
                        <span className="mr-2 text-xl">🛑</span>
                        End Call
                    </button>
                </div>
            )}
            
            {isError && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-semibold border border-red-200">
                    Oops! Something went wrong. Try again.
                </div>
            )}
        </div>

        {/* Instructions */}
        <div className="mt-12 p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 w-full">
            <h3 className="text-lg font-bold text-orange-800 mb-2">How to play:</h3>
            <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
                <li>Click the <span className="font-bold text-green-600">Call</span> button.</li>
                <li>Say <span className="italic">"Hello Shinchan!"</span></li>
                <li>Practice simple English words with him.</li>
                <li>Have fun!</li>
            </ul>
        </div>
      </div>
    </div>
  );
}