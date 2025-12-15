'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';

export default function HomePage() {
  const router = useRouter();
  const buttonClickRef = useRef<HTMLAudioElement>(null);

  const playSound = () => {
    if (buttonClickRef.current) {
      buttonClickRef.current.currentTime = 0;
      buttonClickRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  const handleNavigation = (path: string) => {
    playSound();
    setTimeout(() => {
      router.push(path);
    }, 200); // Delay navigation to let sound play
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center p-8">
      <audio ref={buttonClickRef} src="/sounds/button-click.mp3" preload="auto" />
      
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-8xl font-bold mb-4 text-yellow-400">
          PAZAAK
        </h1>
        <p className="text-xl text-gray-400 mb-12">
          A card game from a galaxy far, far away...
        </p>

        <div className="flex flex-col gap-4 max-w-md mx-auto">
          <button 
            onClick={() => handleNavigation('/singleplayer')}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-8 rounded-lg text-xl transition-colors"
          >
            Single Player
          </button>

          <button 
            disabled 
            className="w-full bg-gray-600 text-gray-400 font-bold py-4 px-8 rounded-lg text-xl cursor-not-allowed"
          >
            Multiplayer (Coming Soon)
          </button>

          <button 
            onClick={() => handleNavigation('/deck-builder')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors"
          >
            Deck Builder
          </button>

          <button 
            onClick={() => handleNavigation('/settings')}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors"
          >
            Settings
          </button>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>Build your deck, challenge the AI, and master the game of Pazaak</p>
        </div>
      </div>
    </div>
  );
}