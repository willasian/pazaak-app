'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type SideCard = { value: number; type: 'plus' | 'minus' | 'plusminus' };

export default function DeckBuilder() {
  const router = useRouter();
  const buttonClickRef = useRef<HTMLAudioElement>(null);
  
  // Available card pool
  const availableCards: SideCard[] = [
    { value: 1, type: 'plus' },
    { value: 2, type: 'plus' },
    { value: 3, type: 'plus' },
    { value: 4, type: 'plus' },
    { value: 1, type: 'minus' },
    { value: 2, type: 'minus' },
    { value: 3, type: 'minus' },
    { value: 4, type: 'minus' },
    { value: 2, type: 'plusminus' },
    { value: 3, type: 'plusminus' },
    { value: 4, type: 'plusminus' },
    { value: 5, type: 'plusminus' },
  ];

  const [selectedCards, setSelectedCards] = useState<SideCard[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [showSaveMessage, setShowSaveMessage] = useState(false);

  useEffect(() => {
    // Load saved deck from sessionStorage
    const savedDeck = sessionStorage.getItem('playerDeck');
    const savedIndices = sessionStorage.getItem('playerDeckIndices');
    if (savedDeck && savedIndices) {
      setSelectedCards(JSON.parse(savedDeck));
      setSelectedIndices(JSON.parse(savedIndices));
    }
  }, []);

  const playSound = () => {
    if (buttonClickRef.current) {
      buttonClickRef.current.currentTime = 0;
      buttonClickRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  const handleReturnToMenu = () => {
    playSound();
    setTimeout(() => {
      router.push('/');
    }, 200);
  };

  const toggleCard = (card: SideCard, index: number) => {
    playSound();
    
    const alreadySelectedIndex = selectedIndices.indexOf(index);

    if (alreadySelectedIndex !== -1) {
      // Card is selected - remove it
      const newCards = [...selectedCards];
      const newIndices = [...selectedIndices];
      newCards.splice(alreadySelectedIndex, 1);
      newIndices.splice(alreadySelectedIndex, 1);
      setSelectedCards(newCards);
      setSelectedIndices(newIndices);
    } else if (selectedCards.length < 8) {
      // Card not selected and room available - add it
      setSelectedCards([...selectedCards, card]);
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const isCardSelected = (index: number) => {
    return selectedIndices.includes(index);
  };

  const removeCardFromDeck = (deckIndex: number) => {
    playSound();
    const newCards = [...selectedCards];
    const newIndices = [...selectedIndices];
    newCards.splice(deckIndex, 1);
    newIndices.splice(deckIndex, 1);
    setSelectedCards(newCards);
    setSelectedIndices(newIndices);
  };

  const saveDeck = () => {
    playSound();
    if (selectedCards.length === 8) {
      sessionStorage.setItem('playerDeck', JSON.stringify(selectedCards));
      sessionStorage.setItem('playerDeckIndices', JSON.stringify(selectedIndices));
      setShowSaveMessage(true);
      setTimeout(() => setShowSaveMessage(false), 2000);
    }
  };

  const renderCard = (card: SideCard) => {
    if (card.type === 'plusminus') {
      return (
        <div className="w-20 h-24 border-2 border-gray-400 rounded flex items-center justify-center text-xl font-bold relative overflow-hidden" style={{ backgroundColor: 'transparent' }}>
          <div className="absolute inset-0" style={{ backgroundColor: '#1d4ed8' }}></div>
          <div className="absolute inset-0" style={{ backgroundColor: '#b91c1c', clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}></div>
          <span className="relative z-10">±{card.value}</span>
        </div>
      );
    } else {
      return (
        <div className="w-20 h-24 border-2 border-gray-400 rounded flex items-center justify-center text-xl font-bold" style={{ backgroundColor: card.type === 'plus' ? '#1d4ed8' : '#b91c1c' }}>
          {card.type === 'plus' ? '+' : '-'}{card.value}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-8">
      <audio ref={buttonClickRef} src="/sounds/button-click.mp3" preload="auto" />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleReturnToMenu}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
          >
            ← Return to Menu
          </button>
          <h1 className="text-4xl font-bold text-yellow-400">Deck Builder</h1>
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        {/* Selected Deck Section */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8 border-2 border-blue-500">
          <h2 className="text-2xl font-bold mb-4 text-blue-400">
            Your Deck ({selectedCards.length}/8)
          </h2>
          <p className="text-sm text-gray-400 mb-3">4 random cards from your deck will be available each match</p>
          <div className="flex gap-4 mb-4 min-h-28 items-start flex-wrap">
            {selectedCards.map((card, i) => (
              <button
                key={i}
                onClick={() => removeCardFromDeck(i)}
                className="transform transition-all hover:scale-105 hover:opacity-75"
              >
                {renderCard(card)}
              </button>
            ))}
            {Array.from({ length: 8 - selectedCards.length }).map((_, i) => (
              <div key={`empty-${i}`} className="w-20 h-24 border-2 border-dashed border-gray-600 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-gray-600 text-3xl">?</span>
              </div>
            ))}
          </div>
          <button
            onClick={saveDeck}
            disabled={selectedCards.length !== 8}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            {selectedCards.length === 8 ? 'Save Deck' : `Select ${8 - selectedCards.length} more card${8 - selectedCards.length === 1 ? '' : 's'}`}
          </button>
          {showSaveMessage && (
            <span className="ml-4 text-green-400 font-semibold">✓ Deck saved!</span>
          )}
        </div>

        {/* Available Cards Section */}
        <div className="bg-slate-800 rounded-lg p-6 border-2 border-purple-500">
          <h2 className="text-2xl font-bold mb-4 text-purple-400">Available Cards</h2>
          <p className="text-gray-400 mb-4">Click on a card to add or remove it from your deck</p>
          <div className="grid grid-cols-6 gap-4">
            {availableCards.map((card, i) => (
              <button
                key={i}
                onClick={() => toggleCard(card, i)}
                className={`transform transition-all hover:scale-105 ${
                  isCardSelected(i) 
                    ? 'opacity-50' 
                    : selectedCards.length >= 8 
                    ? 'opacity-30 cursor-not-allowed' 
                    : ''
                }`}
                disabled={selectedCards.length >= 8 && !isCardSelected(i)}
              >
                {renderCard(card)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Build a deck of 8 cards - 4 random cards will be drawn for each match</p>
        </div>
      </div>
    </div>
  );
}