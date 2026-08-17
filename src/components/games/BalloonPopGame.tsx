import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Trophy, Timer, RefreshCw, ArrowLeft, Award, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateIntegerProblem, GameMathProblem } from '../../utils/gameMathGenerator';
import { soundFx } from '../../services/sound';
import { getGameHighScore, saveGameHighScore } from '../../utils/gameHighScore';

interface BalloonPopGameProps {
  onBack: () => void;
  onSaveScore?: (score: number, details: string) => void;
}

interface BalloonItem {
  id: number;
  val: number;
  isCorrect: boolean;
  colorClass: string;
  xPos: number; // percentage
  yPos: number; // percentage (starts at 100 -> moves to 0)
  speed: number;
  isPopped: boolean;
}

interface PopParticle {
  id: number;
  x: number;
  y: number;
  color: string;
}

const BALLOON_COLORS = [
  'from-rose-500 to-pink-600',
  'from-blue-500 to-indigo-600',
  'from-amber-400 to-orange-500 text-black',
  'from-emerald-400 to-teal-600',
  'from-purple-500 to-violet-600',
];

export const BalloonPopGame: React.FC<BalloonPopGameProps> = ({ onBack, onSaveScore }) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getGameHighScore('balloon_pop'));
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [currentProblem, setCurrentProblem] = useState<GameMathProblem | null>(null);
  const [balloons, setBalloons] = useState<BalloonItem[]>([]);
  const [poppedEffect, setPoppedEffect] = useState<{ text: string; correct: boolean } | null>(null);
  const [popParticles, setPopParticles] = useState<PopParticle[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const floatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const spawnBalloons = () => {
    const prob = generateIntegerProblem('mixed', 'medium');
    setCurrentProblem(prob);

    const generated: BalloonItem[] = prob.options.map((val, idx) => ({
      id: idx,
      val,
      isCorrect: val === prob.answer,
      colorClass: BALLOON_COLORS[idx % BALLOON_COLORS.length],
      xPos: 14 + idx * 24,
      yPos: 85 + Math.random() * 8,
      speed: 0.45 + Math.random() * 0.35,
      isPopped: false,
    }));

    setBalloons(generated);
  };

  const startGame = () => {
    soundFx.playPowerup();
    setScore(0);
    setTimeLeft(35);
    setGameState('playing');
    spawnBalloons();
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

  // Balloon floating upward loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    floatIntervalRef.current = setInterval(() => {
      setBalloons((prev) => {
        let allExited = true;
        const updated = prev.map((b) => {
          if (b.isPopped) return b;
          const nextY = b.yPos - b.speed;
          if (nextY > -10) allExited = false;
          return { ...b, yPos: nextY };
        });

        if (allExited) {
          // If all floated away, respawn
          spawnBalloons();
        }
        return updated;
      });
    }, 40);

    return () => {
      if (floatIntervalRef.current) clearInterval(floatIntervalRef.current);
    };
  }, [gameState, currentProblem]);

  const handlePopBalloon = (balloon: BalloonItem) => {
    if (gameState !== 'playing' || balloon.isPopped) return;

    soundFx.playPop();

    // Mark as popped
    setBalloons((prev) =>
      prev.map((b) => (b.id === balloon.id ? { ...b, isPopped: true } : b))
    );

    // Spawn pop shard particles
    const shards: PopParticle[] = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      x: balloon.xPos + (Math.random() - 0.5) * 12,
      y: balloon.yPos + (Math.random() - 0.5) * 12,
      color: balloon.colorClass,
    }));
    setPopParticles(shards);
    setTimeout(() => setPopParticles([]), 400);

    if (balloon.isCorrect) {
      // Popped correct balloon!
      soundFx.playCorrect();
      soundFx.playExplosion();

      // Confetti burst from balloon position
      confetti({
        particleCount: 45,
        spread: 65,
        origin: { x: balloon.xPos / 100, y: balloon.yPos / 100 },
      });

      const pts = 120;
      const newScore = score + pts;
      setScore(newScore);

      if (newScore > highScore) {
        setHighScore(newScore);
        saveGameHighScore('balloon_pop', newScore);
      }

      setPoppedEffect({ text: `💥 POP! ระเบิดลูกโป่งถูกต้อง +${pts}`, correct: true });

      setTimeout(() => {
        setPoppedEffect(null);
        spawnBalloons();
      }, 450);
    } else {
      // Popped wrong balloon!
      soundFx.playWrong();
      setScore((s) => Math.max(0, s - 40));
      setPoppedEffect({ text: '❌ ผิดลูก! (-40)', correct: false });

      setTimeout(() => {
        setPoppedEffect(null);
      }, 500);
    }
  };

  const endGame = (finalScore: number) => {
    setGameState('gameover');
    soundFx.playFanfare();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    const newHigh = saveGameHighScore('balloon_pop', finalScore);
    setHighScore(newHigh);
    if (onSaveScore) {
      onSaveScore(finalScore, `ลูกโป่งเวทมนตร์ลอยฟ้า: ${finalScore} แต้ม`);
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto bg-slate-950 text-white rounded-3xl border border-pink-500/30 shadow-2xl overflow-hidden min-h-[540px] flex flex-col select-none">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-pink-950/40 via-slate-950 to-black pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-pink-900/40 bg-slate-900/60 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition text-slate-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับเมนูเกม</span>
        </button>

        <div className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm font-mono">
          <div className="flex items-center gap-1 text-pink-400 font-bold">
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
            <div className="w-20 h-20 mx-auto rounded-3xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-4xl shadow-lg shadow-pink-500/20">
              🎈
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-pink-300 via-rose-200 to-white bg-clip-text text-transparent">
                ลูกโป่งเวทมนตร์ลอยฟ้า (Balloon Pop)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                ลูกโป่งตัวเลขจะลอยขึ้นสู่ท้องฟ้า จิ้มระเบิดลูกโป่งที่มีตัวเลขเป็นผลลัพธ์ของการคูณและการหารจำนวนเต็มที่ถูกต้อง!
              </p>
            </div>

            {/* High Score Banner on Ready */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-sm font-bold">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span>คะแนนสูงสุด: {highScore.toLocaleString()} แต้ม</span>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-base shadow-lg shadow-pink-500/30 active:scale-95 transition"
            >
              🎈 เริ่มระเบิดลูกโป่ง (START)
            </button>
          </div>
        )}

        {gameState === 'playing' && currentProblem && (
          <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full py-1">
            {/* Clue Target Prompt */}
            <div className="text-center">
              <div className="inline-block px-5 py-3 rounded-2xl bg-slate-900/90 border border-pink-500/40 shadow-xl backdrop-blur-md">
                <span className="text-[11px] uppercase tracking-widest text-pink-400 font-bold block mb-0.5">
                  โจทย์สำหรับระเบิดลูกโป่ง
                </span>
                <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wider">
                  {currentProblem.expression} = ?
                </span>
              </div>
            </div>

            {/* Balloon Floating Sky Area */}
            <div className="relative h-64 sm:h-72 bg-slate-900/40 rounded-3xl border border-slate-800 my-auto overflow-hidden shadow-inner flex items-center justify-center">
              {poppedEffect && (
                <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                  <span className={`px-4 py-2 rounded-2xl text-base font-black animate-bounce shadow-2xl ${
                    poppedEffect.correct ? 'bg-emerald-500 text-white border-2 border-white' : 'bg-rose-500 text-white'
                  }`}>
                    {poppedEffect.text}
                  </span>
                </div>
              )}

              {/* Pop Fragment Shards Animation */}
              {popParticles.map((p) => (
                <div
                  key={p.id}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  className="absolute w-3 h-3 rounded-full bg-yellow-300 animate-ping pointer-events-none"
                />
              ))}

              {/* Floating Balloons */}
              {balloons.map((b) => {
                if (b.isPopped) return null;
                return (
                  <button
                    key={b.id}
                    onClick={() => handlePopBalloon(b)}
                    style={{
                      left: `${b.xPos}%`,
                      top: `${b.yPos}%`,
                    }}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 p-1 focus:outline-none active:scale-125 transition-transform hover:scale-110"
                  >
                    <div className={`w-16 h-20 sm:w-20 sm:h-24 rounded-[50%] bg-gradient-to-b ${b.colorClass} shadow-xl flex flex-col items-center justify-center border-2 border-white/50 animate-pulse relative`}>
                      <span className="font-mono font-black text-lg sm:text-xl drop-shadow-md">
                        {b.val}
                      </span>
                      {/* Highlight reflection */}
                      <div className="absolute top-2 left-3 w-3 h-4 rounded-full bg-white/40 transform -rotate-45" />
                      {/* String at bottom of balloon */}
                      <div className="absolute -bottom-2.5 w-0.5 h-3 bg-white/60" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-center text-xs text-slate-400 font-medium">
              🎈 แตะหรือคลิกที่ลูกโป่งคำตอบที่ถูกต้องให้แตกกระจาย!
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <Award className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">หมดเวลาระเบิดลูกโป่ง!</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                การคำนวณและการตอบสนองของคุณว่องไวมาก!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-pink-900/50 space-y-2 font-mono">
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
                className="flex-1 py-3.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
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

