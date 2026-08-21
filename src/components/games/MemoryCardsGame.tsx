import React, { useState, useEffect } from 'react';
import { HelpCircle, Trophy, Timer, RefreshCw, ArrowLeft, Award, Sparkles, Star, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateIntegerProblem, GameMathProblem } from '../../utils/gameMathGenerator';
import { soundFx } from '../../services/sound';
import { getGameHighScore, saveGameHighScore } from '../../utils/gameHighScore';

interface MemoryCardsGameProps {
  onBack: () => void;
  onSaveScore?: (score: number, details: string) => void;
}

interface MemoryCard {
  id: number;
  pairId: number;
  type: 'expression' | 'answer';
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryCardsGame: React.FC<MemoryCardsGameProps> = ({ onBack, onSaveScore }) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<MemoryCard[]>([]);
  const [flipsCount, setFlipsCount] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getGameHighScore('memory_cards'));
  const [matchFlash, setMatchFlash] = useState<boolean>(false);

  const totalPairs = 6; // 12 cards total

  const setupDeck = () => {
    const generatedCards: MemoryCard[] = [];
    const usedAnswers = new Set<number>();

    for (let i = 0; i < totalPairs; i++) {
      let prob = generateIntegerProblem('mixed', 'medium');
      let safety = 0;
      while (usedAnswers.has(prob.answer) && safety < 20) {
        prob = generateIntegerProblem('mixed', 'medium');
        safety++;
      }
      usedAnswers.add(prob.answer);

      // Card 1: Expression
      generatedCards.push({
        id: i * 2,
        pairId: i,
        type: 'expression',
        content: prob.expression,
        isFlipped: false,
        isMatched: false,
      });

      // Card 2: Answer
      generatedCards.push({
        id: i * 2 + 1,
        pairId: i,
        type: 'answer',
        content: `${prob.answer}`,
        isFlipped: false,
        isMatched: false,
      });
    }

    // Shuffle cards
    setCards(generatedCards.sort(() => Math.random() - 0.5));
    setFlippedCards([]);
    setFlipsCount(0);
    setMatchedPairs(0);
    setSeconds(0);
    setScore(0);
    setMatchFlash(false);
  };

  const startGame = () => {
    soundFx.playPowerup();
    setupDeck();
    setGameState('playing');
  };

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  const handleCardClick = (card: MemoryCard) => {
    if (gameState !== 'playing' || card.isFlipped || card.isMatched || flippedCards.length >= 2) return;

    soundFx.playCardFlip();
    const updatedCards = cards.map((c) => (c.id === card.id ? { ...c, isFlipped: true } : c));
    setCards(updatedCards);

    const newFlipped = [...flippedCards, card];
    setFlippedCards(newFlipped);
    setFlipsCount((f) => f + 1);

    if (newFlipped.length === 2) {
      const [card1, card2] = newFlipped;
      if (card1.pairId === card2.pairId && card1.type !== card2.type) {
        // MATCH! Launch Fireworks/Confetti!
        soundFx.playCorrect();
        soundFx.playCombo(matchedPairs + 1);

        // Fireworks/Confetti bursts on each correct match!
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#fbbf24']
        });

        setMatchFlash(true);
        setTimeout(() => setMatchFlash(false), 600);

        const earned = 150;
        setScore((s) => s + earned);

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === card1.id || c.id === card2.id ? { ...c, isMatched: true } : c))
          );
          setFlippedCards([]);

          const nextMatched = matchedPairs + 1;
          setMatchedPairs(nextMatched);

          if (nextMatched === totalPairs) {
            // Victory!
            handleGameWin();
          }
        }, 500);
      } else {
        // No match
        soundFx.playWrong();
        setTimeout(() => {
          soundFx.playCardFlip();
          setCards((prev) =>
            prev.map((c) => (c.id === card1.id || c.id === card2.id ? { ...c, isFlipped: false } : c))
          );
          setFlippedCards([]);
        }, 900);
      }
    }
  };

  const handleGameWin = () => {
    setGameState('gameover');
    soundFx.playFanfare();
    confetti({ particleCount: 120, spread: 85, origin: { y: 0.5 } });

    const calculatedScore = Math.max(200, 1000 - seconds * 10 - flipsCount * 15);
    setScore(calculatedScore);
    const newHigh = saveGameHighScore('memory_cards', calculatedScore);
    setHighScore(newHigh);

    if (onSaveScore) {
      onSaveScore(calculatedScore, `จับคู่การ์ดความจำ: ${calculatedScore} แต้ม (เวลา ${seconds}s, เปิด ${flipsCount} ครั้ง)`);
    }
  };

  const stars = flipsCount <= 16 ? 3 : flipsCount <= 24 ? 2 : 1;

  return (
    <div className={`relative w-full max-w-3xl mx-auto bg-slate-950 text-white rounded-3xl border transition-all duration-300 shadow-2xl overflow-hidden min-h-[540px] flex flex-col select-none ${
      matchFlash ? 'border-pink-400 ring-8 ring-pink-500/80 shadow-pink-500/50' : 'border-violet-500/30'
    }`}>
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/40 via-slate-950 to-black pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-violet-900/40 bg-slate-900/60 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition text-slate-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับเมนูเกม</span>
        </button>

        <div className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm font-mono">
          <div className="flex items-center gap-1 text-violet-300 font-bold">
            <Timer className="w-4 h-4" />
            <span>{seconds}s</span>
          </div>

          <div className="text-yellow-300 font-bold">
            เปิด {flipsCount} ครั้ง
          </div>

          <div className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-950/50 px-2.5 py-1 rounded-xl border border-yellow-500/30 text-[11px] sm:text-xs">
            <Crown className="w-3.5 h-3.5 text-yellow-400" />
            <span>สูงสุด: {highScore.toLocaleString()}</span>
          </div>

          <div className="text-emerald-400 font-bold">
            คู่ {matchedPairs} / {totalPairs}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-4 sm:p-6">
        {gameState === 'ready' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-4xl shadow-lg shadow-violet-500/30">
              🃏
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-violet-300 via-pink-200 to-white bg-clip-text text-transparent">
                จับคู่การ์ดความจำ (Memory Card Flip)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                การ์ดเรืองแสงสามมิติ! พลิกเปิดการ์ดจับคู่ระหว่าง <strong>"การ์ดโจทย์การคูณ/หาร"</strong> กับ <strong>"การ์ดคำตอบที่ถูกต้อง"</strong> พร้อมเสียงหมุนการ์ดสามมิติและพลุเฉลิมฉลอง!
              </p>
            </div>

            {/* High Score Banner on Ready */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-sm font-bold">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span>คะแนนสูงสุด: {highScore.toLocaleString()} แต้ม</span>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-extrabold text-base shadow-lg shadow-violet-500/40 hover:shadow-violet-500/60 active:scale-95 transition"
            >
              🃏 เริ่มเปิดการ์ดเรืองแสง (START)
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full py-1">
            {/* 4x3 Cards Grid with 3D Perspective */}
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 my-auto">
              {cards.map((card) => {
                const isRevealed = card.isFlipped || card.isMatched;
                return (
                  <div
                    key={card.id}
                    className="h-20 sm:h-24 [perspective:1000px]"
                  >
                    <button
                      type="button"
                      onClick={() => handleCardClick(card)}
                      disabled={card.isMatched}
                      aria-label={`การ์ดใบที่ ${card.id + 1}`}
                      className={`relative w-full h-full rounded-2xl transition-transform duration-500 [transform-style:preserve-3d] focus:outline-none ${
                        isRevealed ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
                      }`}
                    >
                      {/* Front Face (Unflipped Back of Card - Glowing Button) */}
                      <div
                        className={`absolute inset-0 w-full h-full rounded-2xl [backface-visibility:hidden] flex flex-col items-center justify-center p-2 border-2 transition-all cursor-pointer ${
                          card.isMatched
                            ? 'opacity-0 pointer-events-none'
                            : 'bg-gradient-to-br from-slate-900 via-violet-950/60 to-slate-950 border-violet-500/60 shadow-[0_0_15px_rgba(139,92,246,0.35)] hover:border-violet-300 hover:shadow-[0_0_22px_rgba(168,85,247,0.75)] hover:scale-[1.03] active:scale-95'
                        }`}
                      >
                        {/* Glowing neon corner accents */}
                        <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-violet-400/80 shadow-[0_0_6px_#a855f7]" />
                        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-400/80 shadow-[0_0_6px_#a855f7]" />
                        <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-violet-400/80 shadow-[0_0_6px_#a855f7]" />
                        <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-400/80 shadow-[0_0_6px_#a855f7]" />

                        <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-400/50 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                          <HelpCircle className="w-5 h-5 text-violet-300" />
                        </div>
                      </div>

                      {/* Back Face (Revealed Card Front - 3D Rotated & Glowing) */}
                      <div
                        className={`absolute inset-0 w-full h-full rounded-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] flex items-center justify-center p-2 border-2 font-mono font-black select-none ${
                          card.isMatched
                            ? 'bg-gradient-to-br from-emerald-950/90 via-teal-950 to-slate-950 border-emerald-400/80 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.6)] cursor-default'
                            : card.type === 'expression'
                            ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-cyan-400 text-cyan-200 text-sm sm:text-base shadow-[0_0_24px_rgba(6,182,212,0.7)]'
                            : 'bg-gradient-to-br from-fuchsia-950 via-purple-950 to-slate-950 border-pink-400 text-yellow-300 text-lg sm:text-2xl shadow-[0_0_24px_rgba(236,72,153,0.7)]'
                        }`}
                      >
                        {/* Shimmer reflection */}
                        <div className="absolute top-1 left-2 right-2 h-1/3 bg-white/10 rounded-t-xl pointer-events-none" />
                        <span className="text-center drop-shadow-md z-10">{card.content}</span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="text-center text-xs text-slate-400 font-medium">
              ✨ แตะการ์ดเรืองแสงเพื่อหมุนแบบสามมิติ จับคู่โจทย์และคำตอบให้ถูกต้อง
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="flex justify-center gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-8 h-8 ${
                    i < stars ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]' : 'text-slate-700'
                  }`}
                />
              ))}
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">ยอดเยี่ยม! จับคู่ครบทุกใบ</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                ความจำและการคำนวณจำนวนเต็มของคุณเฉียบคมมาก!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-violet-900/50 space-y-2 font-mono">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">คะแนนรอบนี้:</span>
                <span className="text-amber-400 font-bold text-lg">{score.toLocaleString()} แต้ม</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">คะแนนสูงสุด:</span>
                <span className="text-yellow-300 font-bold text-lg flex items-center gap-1">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  {highScore.toLocaleString()} แต้ม
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">เวลาที่ใช้:</span>
                <span className="text-violet-300 font-bold">{seconds} วินาที</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">จำนวนครั้งที่เปิดการ์ด:</span>
                <span className="text-amber-400 font-bold">{flipsCount} ครั้ง</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="flex-1 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-md shadow-violet-500/30 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>เล่นใหม่อีกครั้ง</span>
              </button>
              <button
                onClick={onBack}
                className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition"
              >
                กลับเมนู
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

