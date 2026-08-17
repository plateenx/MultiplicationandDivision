import React, { useState, useEffect, useRef } from 'react';
import { Hammer, Trophy, Timer, RefreshCw, ArrowLeft, Award, Sparkles, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateIntegerProblem, GameMathProblem } from '../../utils/gameMathGenerator';
import { soundFx } from '../../services/sound';
import { getGameHighScore, saveGameHighScore } from '../../utils/gameHighScore';

interface WhackMoleGameProps {
  onBack: () => void;
  onSaveScore?: (score: number, details: string) => void;
}

interface MoleHole {
  id: number;
  isActive: boolean;
  value: number;
  isCorrect: boolean;
}

export const WhackMoleGame: React.FC<WhackMoleGameProps> = ({ onBack, onSaveScore }) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getGameHighScore('whack_mole'));
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [currentProblem, setCurrentProblem] = useState<GameMathProblem | null>(null);
  const [holes, setHoles] = useState<MoleHole[]>(() =>
    Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      isActive: false,
      value: 0,
      isCorrect: false,
    }))
  );
  const [whackEffect, setWhackEffect] = useState<{ holeId: number; text: string; correct: boolean } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const moleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const spawnMoles = () => {
    const prob = generateIntegerProblem('mixed', 'medium');
    setCurrentProblem(prob);

    // Pick 3 random holes to activate
    const activeHoleIndices = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, 3);
    const correctHoleIdx = activeHoleIndices[Math.floor(Math.random() * activeHoleIndices.length)];

    const distractors = prob.options.filter((o) => o !== prob.answer);

    setHoles((prev) =>
      prev.map((hole, idx) => {
        if (!activeHoleIndices.includes(idx)) {
          return { ...hole, isActive: false, value: 0, isCorrect: false };
        }
        if (idx === correctHoleIdx) {
          return { ...hole, isActive: true, value: prob.answer, isCorrect: true };
        } else {
          const fakeVal = distractors.pop() ?? prob.answer + 2;
          return { ...hole, isActive: true, value: fakeVal, isCorrect: false };
        }
      })
    );
  };

  const startGame = () => {
    soundFx.playPowerup();
    setScore(0);
    setTimeLeft(30);
    setGameState('playing');
    spawnMoles();
  };

  // Game timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame(score);
          return 0;
        }
        if (t <= 5) soundFx.playCountdown();
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, score]);

  // Periodic mole reshuffle if player is waiting
  useEffect(() => {
    if (gameState !== 'playing') return;

    moleTimerRef.current = setInterval(() => {
      spawnMoles();
    }, 3200);

    return () => {
      if (moleTimerRef.current) clearInterval(moleTimerRef.current);
    };
  }, [gameState, currentProblem]);

  const handleWhackMole = (hole: MoleHole) => {
    if (gameState !== 'playing' || !hole.isActive) return;

    soundFx.playHit();

    if (hole.isCorrect) {
      // Whacked the right mole!
      soundFx.playCorrect();
      const pts = 100;
      const newScore = score + pts;
      setScore(newScore);

      if (newScore > highScore) {
        setHighScore(newScore);
        saveGameHighScore('whack_mole', newScore);
      }

      setWhackEffect({ holeId: hole.id, text: `💥 +${pts}`, correct: true });

      setTimeout(() => {
        setWhackEffect(null);
        spawnMoles();
      }, 350);
    } else {
      // Whacked wrong mole!
      soundFx.playWrong();
      setScore((s) => Math.max(0, s - 30));
      setWhackEffect({ holeId: hole.id, text: '❌ ผิดตัว!', correct: false });

      setTimeout(() => {
        setWhackEffect(null);
        spawnMoles();
      }, 350);
    }
  };

  const endGame = (finalScore: number) => {
    setGameState('gameover');
    soundFx.playFanfare();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    const newHigh = saveGameHighScore('whack_mole', finalScore);
    setHighScore(newHigh);
    if (onSaveScore) {
      onSaveScore(finalScore, `ตุ่นขุดทองจำนวนเต็ม: ${finalScore} แต้ม`);
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto bg-slate-950 text-white rounded-3xl border border-amber-600/30 shadow-2xl overflow-hidden min-h-[540px] flex flex-col select-none">
      {/* Background Soil theme */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/40 via-slate-950 to-black pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-amber-900/40 bg-slate-900/60 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition text-slate-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับเมนูเกม</span>
        </button>

        <div className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm font-mono">
          <div className="flex items-center gap-1 text-amber-400 font-bold">
            <Timer className={`w-4 h-4 ${timeLeft <= 5 ? 'animate-ping text-rose-500' : ''}`} />
            <span className={timeLeft <= 5 ? 'text-rose-400 font-black' : ''}>{timeLeft}s</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-300 font-bold">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>{score.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-950/50 px-2.5 py-1 rounded-xl border border-yellow-500/30 text-[11px] sm:text-xs">
            <Crown className="w-3.5 h-3.5 text-yellow-400" />
            <span>สูงสุด: {highScore.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-4 sm:p-6">
        {gameState === 'ready' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-4xl shadow-lg shadow-amber-600/20">
              🐹
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-300 via-orange-200 to-white bg-clip-text text-transparent">
                ตุ่นขุดทองจำนวนเต็ม (Whack-a-Mole)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                ตุ่นจะโผล่ขึ้นมาจากหลุมพร้อมป้ายตัวเลข ทุบตุ่นที่มีตัวเลขตรงกับผลลัพธ์ของการคูณ/หารจำนวนเต็มให้ทันเวลา!
              </p>
            </div>

            {/* High Score Banner on Ready */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-sm font-bold">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span>คะแนนสูงสุด: {highScore.toLocaleString()} แต้ม</span>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-black text-base shadow-lg shadow-amber-500/30 active:scale-95 transition"
            >
              🔨 เริ่มทุบตุ่น (START)
            </button>
          </div>
        )}

        {gameState === 'playing' && currentProblem && (
          <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full py-2">
            {/* Clue Prompt */}
            <div className="text-center">
              <div className="inline-block px-5 py-3 rounded-2xl bg-slate-900/90 border border-amber-500/40 shadow-xl backdrop-blur-md">
                <span className="text-[11px] uppercase tracking-widest text-amber-400 font-bold block mb-0.5">
                  โจทย์สำหรับทุบตุ่น
                </span>
                <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wider">
                  {currentProblem.expression} = ?
                </span>
              </div>
            </div>

            {/* 6 Mole Holes Grid */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 my-auto">
              {holes.map((hole) => (
                <div
                  key={hole.id}
                  onClick={() => handleWhackMole(hole)}
                  className={`relative h-28 sm:h-32 rounded-3xl border-2 flex flex-col items-center justify-end p-2 transition cursor-pointer overflow-hidden ${
                    hole.isActive
                      ? 'bg-amber-950/70 border-amber-500/60 shadow-lg shadow-amber-950/50 hover:scale-105 active:scale-95'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  {/* Mole Dirt Rim */}
                  <div className="absolute bottom-0 inset-x-0 h-8 bg-amber-950 rounded-b-3xl border-t border-amber-800/60" />

                  {/* Whack Floating Text */}
                  {whackEffect && whackEffect.holeId === hole.id && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                      <span className={`px-2 py-1 rounded-xl text-sm font-black animate-bounce ${
                        whackEffect.correct ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      }`}>
                        {whackEffect.text}
                      </span>
                    </div>
                  )}

                  {/* Mole Character */}
                  {hole.isActive && (
                    <div className="relative z-10 flex flex-col items-center animate-bounce">
                      <div className="text-3xl sm:text-4xl">🐹</div>
                      <div className="px-2 py-0.5 rounded-lg bg-slate-900 border border-amber-400 font-mono font-black text-xs sm:text-sm text-amber-300 shadow-md">
                        {hole.value}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Hint */}
            <div className="text-center text-xs text-slate-400 font-medium">
              🔨 แตะหรือคลิกที่ตัวตุ่นที่ถือคำตอบที่ถูกต้องให้ไวที่สุด!
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <Award className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">หมดเวลาทุบตุ่น!</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                คุณทุบตุ่นได้อย่างแม่นยำและรวดเร็ว
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-900/50 space-y-2 font-mono">
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
            </div>

            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="flex-1 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
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
