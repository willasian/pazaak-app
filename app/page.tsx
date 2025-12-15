'use client';

import { useState, useEffect, useRef } from 'react';

type Card = number;
type SideCard = { value: number; type: 'plus' | 'minus' | 'plusminus' };
type PlayedCard = { value: number; isMainDeck: boolean; isPlusMinus?: boolean };

export default function PazaakGame() {
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [playerCards, setPlayerCards] = useState<PlayedCard[]>([]);
  const [opponentCards, setOpponentCards] = useState<PlayedCard[]>([]);
  const [playerStanding, setPlayerStanding] = useState(false);
  const [opponentStanding, setOpponentStanding] = useState(false);
  const [gameOver, setGameOver] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [currentTurn, setCurrentTurn] = useState<'player' | 'opponent'>('player');
  const [waitingForPlayer, setWaitingForPlayer] = useState(true);
  const [turnCount, setTurnCount] = useState(0);
  const [matchScore, setMatchScore] = useState({ player: 0, opponent: 0 });
  const [currentGame, setCurrentGame] = useState(1);
  const [matchWinner, setMatchWinner] = useState<string | null>(null);
  const [opponentSideDeck] = useState<SideCard[]>([
    { value: 1, type: 'plus' },
    { value: 2, type: 'plus' },
    { value: 3, type: 'minus' },
    { value: 4, type: 'plusminus' },
  ]);
  const [opponentSideHand, setOpponentSideHand] = useState<SideCard[]>([]);
  const [playerSideDeck] = useState<SideCard[]>([
    { value: 1, type: 'plus' },
    { value: 2, type: 'plus' },
    { value: 3, type: 'minus' },
    { value: 4, type: 'plusminus' },
  ]);
  const [playerSideHand, setPlayerSideHand] = useState<SideCard[]>([]);

  // Audio refs
  const cardDrawRef = useRef<HTMLAudioElement>(null);
  const cardPlayRef = useRef<HTMLAudioElement>(null);
  const winRef = useRef<HTMLAudioElement>(null);
  const loseRef = useRef<HTMLAudioElement>(null);
  const standRef = useRef<HTMLAudioElement>(null);
  const buttonClickRef = useRef<HTMLAudioElement>(null);

  // Helper function to play sounds
  const playSound = (audioRef: React.RefObject<HTMLAudioElement | null>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  const drawMainCard = (): Card => Math.floor(Math.random() * 10) + 1;

  const startGame = () => {
    setPlayerScore(0);
    setOpponentScore(0);
    setPlayerCards([]);
    setOpponentCards([]);
    setPlayerStanding(false);
    setOpponentStanding(false);
    setGameOver(false);
    setWinner(null);
    setCurrentTurn('player');
    setWaitingForPlayer(true);
    setTurnCount(0);
  };

  const startNewMatch = () => {
    startGame();
    setPlayerSideHand([...playerSideDeck]);
    setOpponentSideHand([...opponentSideDeck]);
    setMatchScore({ player: 0, opponent: 0 });
    setCurrentGame(1);
    setMatchWinner(null);
  };

  // Check for game end after each state update
  useEffect(() => {
    if (gameOver) return;

    // Check if both players are standing
    if (playerStanding && opponentStanding) {
      determineWinner();
      return;
    }

    // Auto-draw card at start of player's turn
    if (currentTurn === 'player' && !playerStanding && waitingForPlayer) {
      setTimeout(() => {
        playerDrawCard();
      }, 500);
    }

    // If it's opponent's turn and they haven't stood, play their turn
    if (currentTurn === 'opponent' && !opponentStanding) {
      setTimeout(() => {
        playOpponentTurn();
      }, 1000);
    }
  }, [currentTurn, playerStanding, opponentStanding, waitingForPlayer, gameOver, turnCount]);

  const playerDrawCard = () => {
    if (playerStanding || gameOver || currentTurn !== 'player') return;

    const cardValue = drawMainCard();
    const newCards = [...playerCards, { value: cardValue, isMainDeck: true }];
    const newScore = playerScore + cardValue;

    setPlayerCards(newCards);
    setPlayerScore(newScore);
    setWaitingForPlayer(false); // Now waiting for player decision
    playSound(cardDrawRef); // Play card draw sound

    if (newScore === 20) {
      // Auto-stand at 20
      setPlayerStanding(true);
      playSound(standRef); // Play stand sound
      // Don't pass turn to opponent if they're already standing
      if (!opponentStanding) {
        setCurrentTurn('opponent');
      }
    }
    // Otherwise player can choose to use side card or end turn
  };

  const playerEndTurn = () => {
    if (gameOver || currentTurn !== 'player' || waitingForPlayer) return;
    
    // Check if player is bust when ending turn
    if (playerScore > 20) {
      endGame('Opponent');
      return;
    }
    
    playSound(buttonClickRef); // Play button click sound
    
    // If opponent is standing, reset for another player turn
    if (opponentStanding) {
      setWaitingForPlayer(true);
      // Stay on player's turn - they get another card
    } else {
      setWaitingForPlayer(true);
      setCurrentTurn('opponent');
    }
  };

  const playerStand = () => {
    if (playerStanding || gameOver || currentTurn !== 'player') return;
    
    // Check if player is bust when standing
    if (playerScore > 20) {
      endGame('Opponent');
      return;
    }
    
    playSound(standRef); // Play stand sound
    
    setPlayerStanding(true);
    setWaitingForPlayer(true);
    // Only pass turn if opponent isn't standing
    if (!opponentStanding) {
      setCurrentTurn('opponent');
    }
  };

  const useSideCard = (index: number, sign: 'plus' | 'minus') => {
    if (playerStanding || gameOver || currentTurn !== 'player' || waitingForPlayer) return;

    const sideCard = playerSideHand[index];
    const value = sign === 'plus' ? sideCard.value : -sideCard.value;
    const newScore = playerScore + value;

    setPlayerScore(newScore);
    setPlayerSideHand(playerSideHand.filter((_, i) => i !== index));
    // Add the played side card to the cards display
    setPlayerCards([...playerCards, { 
      value: value, 
      isMainDeck: false,
      isPlusMinus: sideCard.type === 'plusminus'
    }]);
    
    playSound(cardPlayRef); // Play card play sound

    if (newScore === 20) {
      // Auto-stand at 20
      setPlayerStanding(true);
      setWaitingForPlayer(true);
      playSound(standRef); // Play stand sound
      // Only pass turn if opponent isn't standing
      if (!opponentStanding) {
        setCurrentTurn('opponent');
      }
    }
    // Otherwise, player can continue using more side cards or end turn manually
  };

  const playOpponentTurn = () => {
    if (opponentStanding || gameOver) return;

    const cardValue = drawMainCard();
    const newCards = [...opponentCards, { value: cardValue, isMainDeck: true }];
    const newScore = opponentScore + cardValue;

    setOpponentCards(newCards);
    setOpponentScore(newScore);
    playSound(cardDrawRef); // Play card draw sound

    if (newScore > 20) {
      endGame('Player');
    } else if (newScore === 20) {
      setOpponentStanding(true);
      playSound(standRef); // Play stand sound
      // Only pass turn if player isn't standing
      if (!playerStanding) {
        setCurrentTurn('player');
        setWaitingForPlayer(true);
      }
    } else if (newScore >= 17) {
      // Simple AI: stand at 17+
      setOpponentStanding(true);
      playSound(standRef); // Play stand sound
      // Only pass turn if player isn't standing
      if (!playerStanding) {
        setCurrentTurn('player');
        setWaitingForPlayer(true);
      }
    } else {
      // If player is standing, opponent keeps playing (stay on opponent turn)
      // Otherwise pass turn back to player
      if (playerStanding) {
        // Stay on opponent turn - increment turnCount to trigger useEffect
        setTurnCount(prev => prev + 1);
      } else {
        setCurrentTurn('player');
        setWaitingForPlayer(true);
      }
    }
  };

  const determineWinner = () => {
    if (playerScore > 20) {
      endGame('Opponent');
    } else if (opponentScore > 20) {
      endGame('Player');
    } else if (playerScore > opponentScore) {
      endGame('Player');
    } else if (opponentScore > playerScore) {
      endGame('Opponent');
    } else {
      endGame('Tie');
    }
  };

  const endGame = (result: string) => {
    setGameOver(true);
    setWinner(result);
    
    // Play win/lose sound
    if (result === 'Player') {
      playSound(winRef);
    } else if (result === 'Opponent') {
      playSound(loseRef);
    }
    
    // Update match score
    if (result === 'Player') {
      const newScore = { ...matchScore, player: matchScore.player + 1 };
      setMatchScore(newScore);
      
      // Check if player won the match (first to 3)
      if (newScore.player === 3) {
        setMatchWinner('Player');
      } else {
        setCurrentGame(currentGame + 1);
      }
    } else if (result === 'Opponent') {
      const newScore = { ...matchScore, opponent: matchScore.opponent + 1 };
      setMatchScore(newScore);
      
      // Check if opponent won the match (first to 3)
      if (newScore.opponent === 3) {
        setMatchWinner('Opponent');
      } else {
        setCurrentGame(currentGame + 1);
      }
    } else {
      // Tie doesn't count toward match score, just move to next game
      setCurrentGame(currentGame + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-8">
      {/* Hidden audio elements */}
      <audio ref={cardDrawRef} src="/sounds/card-draw.mp3" preload="auto" />
      <audio ref={cardPlayRef} src="/sounds/card-play.mp3" preload="auto" />
      <audio ref={winRef} src="/sounds/win.mp3" preload="auto" />
      <audio ref={loseRef} src="/sounds/lose.mp3" preload="auto" />
      <audio ref={standRef} src="/sounds/stand.mp3" preload="auto" />
      <audio ref={buttonClickRef} src="/sounds/button-click.mp3" preload="auto" />
      
      <div className="max-w-3xl mx-auto">
        <h1 className="text-6xl font-bold text-center mb-8 text-yellow-400">
          PAZAAK
        </h1>

        {/* Match Score Display - Only show during match */}
        {(matchScore.player > 0 || matchScore.opponent > 0) && (
          <div className="text-center mb-6">
            <div className="inline-block bg-slate-700 px-6 py-3 rounded-lg">
              <p className="text-sm text-gray-300 mb-1">First to 3 - Game {currentGame}</p>
              <div className="flex gap-6 items-center">
                <div className="text-center">
                  <p className="text-xs text-gray-400">You</p>
                  <p className="text-2xl font-bold text-blue-400">{matchScore.player}</p>
                </div>
                <div className="text-gray-500">-</div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Opponent</p>
                  <p className="text-2xl font-bold text-red-400">{matchScore.opponent}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {gameOver && playerCards.length === 0 ? (
          <div className="text-center mt-16">
            <button
              onClick={startNewMatch}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg text-xl"
            >
              Single Player
            </button>
          </div>
        ) : (
          <>
            {/* Turn Indicator */}
            <div className="text-center mb-4">
              <p className="text-xl font-semibold">
                {gameOver ? 'Game Over' : currentTurn === 'player' ? 'Your Turn' : "Opponent's Turn"}
              </p>
            </div>

            {/* Side-by-Side Layout */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Player Section (Left) */}
              <div className="p-6 bg-slate-800 rounded-lg border-2 border-blue-500">
                <h2 className="text-2xl font-bold mb-4 text-blue-400">
                  Player: {playerScore}
                  {playerStanding && ' (STANDING)'}
                </h2>
                
                {/* Player's Cards - Fixed 4x3 Grid */}
                <div className="mb-4">
                  <h3 className="text-sm text-gray-400 mb-2">Playing Area:</h3>
                  <div className="grid grid-cols-4 gap-2 w-72 h-72">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const card = playerCards[i];
                      return card ? (
                        <div
                          key={i}
                          className={`w-16 h-20 border-2 border-gray-400 rounded flex items-center justify-center text-2xl font-bold relative overflow-hidden ${
                            card.isMainDeck 
                              ? 'bg-yellow-700' 
                              : card.isPlusMinus
                              ? ''
                              : card.value > 0
                              ? 'bg-blue-700'
                              : 'bg-red-700'
                          }`}
                        >
                          {card.isPlusMinus && (
                            <>
                              <div className="absolute inset-0 bg-blue-700" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>
                              <div className="absolute inset-0 bg-red-700" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}></div>
                            </>
                          )}
                          <span className="relative z-10">{card.value > 0 ? `+${card.value}` : card.value}</span>
                        </div>
                      ) : (
                        <div key={i} className="w-16 h-20 bg-gray-700 border-2 border-gray-600 rounded"></div>
                      );
                    })}
                  </div>
                </div>

                {/* Player Hand */}
                <div className="mt-4">
                  <h3 className="text-sm text-gray-400 mb-2">Player Hand:</h3>
                  <div className="flex gap-2">
                    {playerSideHand.map((card, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        {card.type === 'plusminus' ? (
                          <div className="w-16 h-20 border-2 border-gray-400 rounded flex items-center justify-center text-lg font-bold relative overflow-hidden" style={{ backgroundColor: 'transparent' }}>
                            <div className="absolute inset-0" style={{ backgroundColor: '#1d4ed8' }}></div>
                            <div className="absolute inset-0" style={{ backgroundColor: '#b91c1c', clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}></div>
                            <span className="relative z-10">±{card.value}</span>
                          </div>
                        ) : (
                          <div className="w-16 h-20 border-2 border-gray-400 rounded flex items-center justify-center text-lg font-bold" style={{ backgroundColor: card.type === 'plus' ? '#1d4ed8' : '#b91c1c' }}>
                            {card.type === 'plus' ? '+' : '-'}{card.value}
                          </div>
                        )}
                        {card.type === 'plusminus' ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => useSideCard(i, 'plus')}
                              disabled={playerStanding || gameOver || currentTurn !== 'player' || waitingForPlayer}
                              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-xs py-1 rounded"
                            >
                              +
                            </button>
                            <button
                              onClick={() => useSideCard(i, 'minus')}
                              disabled={playerStanding || gameOver || currentTurn !== 'player' || waitingForPlayer}
                              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-xs py-1 rounded"
                            >
                              -
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => useSideCard(i, card.type === 'plus' ? 'plus' : 'minus')}
                            disabled={playerStanding || gameOver || currentTurn !== 'player' || waitingForPlayer}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-xs py-1 rounded"
                          >
                            Use
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Opponent Section (Right) */}
              <div className="p-6 bg-slate-800 rounded-lg border-2 border-red-500">
                <h2 className="text-2xl font-bold mb-4 text-red-400">
                  Opponent: {opponentScore}
                  {opponentStanding && ' (STANDING)'}
                </h2>
                
                {/* Opponent's Cards - Fixed 4x3 Grid */}
                <div className="mb-4">
                  <h3 className="text-sm text-gray-400 mb-2">Playing Area:</h3>
                  <div className="grid grid-cols-4 gap-2 w-72 h-72">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const card = opponentCards[i];
                      return card ? (
                        <div
                          key={i}
                          className={`w-16 h-20 border-2 border-gray-400 rounded flex items-center justify-center text-2xl font-bold relative overflow-hidden ${
                            card.isMainDeck 
                              ? 'bg-yellow-700' 
                              : card.isPlusMinus
                              ? ''
                              : card.value > 0
                              ? 'bg-blue-700'
                              : 'bg-red-700'
                          }`}
                        >
                          {card.isPlusMinus && (
                            <>
                              <div className="absolute inset-0 bg-blue-700" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>
                              <div className="absolute inset-0 bg-red-700" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}></div>
                            </>
                          )}
                          <span className="relative z-10">{card.value > 0 ? `+${card.value}` : card.value}</span>
                        </div>
                      ) : (
                        <div key={i} className="w-16 h-20 bg-gray-700 border-2 border-gray-600 rounded"></div>
                      );
                    })}
                  </div>
                </div>

                {/* Opponent Hand (face down) */}
                <div className="mt-4">
                  <h3 className="text-sm text-gray-400 mb-2">Opponent Hand:</h3>
                  <div className="flex gap-2">
                    {opponentSideHand.map((_, i) => (
                      <div
                        key={i}
                        className="w-16 h-20 bg-gray-700 border-2 border-gray-500 rounded flex items-center justify-center"
                      >
                        <span className="text-3xl text-gray-500">?</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={playerEndTurn}
                disabled={playerStanding || gameOver || currentTurn !== 'player' || waitingForPlayer}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg"
              >
                End Turn
              </button>
              <button
                onClick={playerStand}
                disabled={playerStanding || gameOver || currentTurn !== 'player' || waitingForPlayer}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg"
              >
                Stand
              </button>
            </div>
          </>
        )}
      </div>

      {/* Game Over Modal - Outside main container for proper overlay */}
      {gameOver && playerCards.length > 0 && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-slate-800 border-4 border-yellow-500 rounded-lg p-8 max-w-md text-center">
            {matchWinner ? (
              <>
                <h2 className="text-4xl font-bold mb-4 text-yellow-400">
                  {matchWinner} Wins the Match!
                </h2>
                <p className="text-xl mb-6">
                  Final Score: {matchScore.player} - {matchScore.opponent}
                </p>
                <button
                  onClick={startNewMatch}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg text-xl"
                >
                  New Match
                </button>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold mb-4 text-yellow-400">
                  {winner === 'Tie'
                    ? "It's a Tie!"
                    : `${winner} Wins Game ${currentGame - 1}!`}
                </h2>
                <p className="text-lg mb-6 text-gray-300">
                  Match Score: You {matchScore.player} - {matchScore.opponent} Opponent
                </p>
                <button
                  onClick={startGame}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg text-xl"
                >
                  Next Game
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}