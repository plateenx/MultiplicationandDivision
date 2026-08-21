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
  const [currentRound, setCurrentRound] = useState<number>(1);
  const totalRounds = 10;
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(100); // 100 ticks = 10.0s
  const [currentProblem, setCurrentProblem] = useState<GameMathProblem | null>(null);
  const [balloons, setBalloons] = useState<BalloonItem[]>([]);
  const [poppedEffect, setPoppedEffect] = useState<{ text: string; correct: boolean } | null>(null);
  const [popParticles, setPopParticles] = useState<PopParticle[]>([]);

  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const floatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const spawnBalloonsForRound = (roundNum: number) => {
    if (roundNum > totalRounds) {
      endGame(score);
      return;
    }

    const prob = generateIntegerProblem('mixed', 'medium');
    setCurrentProblem(prob);
    setQuestionTimeLeft(100);

    const generated: BalloonItem[] = prob.options.map((val, idx) => ({
      id: idx,
      val,
      isCorrect: val === prob.answer,
      colorClass: BALLOON_COLORS[idx % BALLOON_COLORS.length],
      xPos: 16 + idx * 23,
      yPos: 82 + (idx % 2 === 0 ? 0 : 5),
      speed: 0.38,
      isPopped: false,
    }));

    setBalloons(generated);
  };

  const startGame = () => {
    soundFx.playPowerup();
    setScore(0);
    setCurrentRound(1);
    setGameState('playing');
    spawnBalloonsForRound(1);
  };

  // 10 Seconds Timer Per Question (100 ticks * 100ms = 10.0 seconds)
  useEffect(() => {
    if (gameState !== 'playing') return;

    questionTimerRef.current = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up for this balloon question
          soundFx.playWrong();
          setPoppedEffect({ text: '⏳ หมดเวลาข้อนี้! ลูกโป่งลอยหนีไปแล้ว', correct: false });

          setTimeout(() => {
            setPoppedEffect(null);
            setCurrentRound((r) => {
              const nextR = r + 1;
              if (nextR > totalRounds) {
                endGame(score);
              } else {
                spawnBalloonsForRound(nextR);
              }
              return nextR;
            });
          }, 800);

          return 0;
        }
        if (prev === 30 || prev === 20 || prev === 10) {
          soundFx.playCountdown();
        }
        return prev - 1;
      });
    }, 100);

    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [gameState, currentRound, score]);

  // Balloon floating upward loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    floatIntervalRef.current = setInterval(() => {
      setBalloons((prev) => {
        return prev.map((b) => {
          if (b.isPopped) return b;
          return { ...b, yPos: b.yPos - 0.38 };
        });
      });
    }, 40);

    return () => {
      if (floatIntervalRef.current) clearInterval(floatIntervalRef.current);
    };
  }, [gameState, currentProblem]);

  const handlePopBalloon = (balloon: BalloonItem) => {
    if (gameState !== 'playing' || balloon.isPopped || poppedEffect) return;

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
        origin: { x: balloon.xPos / 100, y: Math.max(0.1, balloon.yPos / 100) },
      });

      const timeBonus = Math.round(questionTimeLeft * 0.5);
      const pts = 100 + timeBonus;
      const newScore = score + pts;
      setScore(newScore);

      if (newScore > highScore) {
        setHighScore(newScore);
        saveGameHighScore('balloon_pop', newScore);
      }

      setPoppedEffect({ text: `💥 POP! ถูกต้อง +${pts}`, correct: true });

      setTimeout(() => {
        setPoppedEffect(null);
        setCurrentRound((r) => {
          const nextR = r + 1;
          if (nextR > totalRounds) {
            endGame(newScore);
          } else {
            spawnBalloonsForRound(nextR);
          }
          return nextR;
        });
      }, 500);
    } else {
      // Popped wrong balloon!
      soundFx.playWrong();
      setScore((s) => Math.max(0, s - 30));
      setPoppedEffect({ text: '❌ ผิดลูก! (-30)', correct: false });

      setTimeout(() => {
        setPoppedEffect(null);
      }, 450);
    }
  };

  const endGame = (finalScore: number) => {
    setGameState('gameover');
    soundFx.playFanfare();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    const newHigh = saveGameHighScore('balloon_pop', finalScore);
    setHighScore(newHigh);
    if (onSaveScore) {
      onSaveScore(finalScore, `ลูกโป่งเวทมนตร์ลอยฟ้า: ${finalScore} แต้ม (10 ข้อละ 10 วินาที)`);
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
            <span>ข้อ {Math.min(currentRound, totalRounds)} / {totalRounds}</span>
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
                ลูกโป่งตัวเลขจะลอยขึ้นสู่ท้องฟ้า จิ้มระเบิดลูกโป่งที่มีตัวเลขเป็นผลลัพธ์ของการคูณและการหารจำนวนเต็มที่ถูกต้อง (10 ข้อ ข้อละ 10 วินาที)!
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
            {/* Clue Target Prompt & 10s Countdown */}
            <div className="space-y-2 text-center">
              <div className="inline-block px-5 py-2.5 rounded-2xl bg-slate-900/90 border border-pink-500/40 shadow-xl backdrop-blur-md">
                <span className="text-[11px] uppercase tracking-widest text-pink-400 font-bold block mb-0.5">
                  โจทย์ข้อที่ {currentRound}/{totalRounds}
                </span>
                <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wider">
                  {currentProblem.expression} = ?
                </span>
              </div>

              {/* 10-second countdown bar */}
              <div className="space-y-1 max-w-xs mx-auto">
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span>เวลาลอยลูกโป่ง</span>
                  <span className={`font-bold ${questionTimeLeft <= 30 ? 'text-rose-400 animate-pulse' : 'text-pink-300'}`}>
                    ⏳ {(questionTimeLeft / 10).toFixed(1)}s / 10s
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                  <div
                    className={`h-full transition-all duration-100 ${
                      questionTimeLeft > 50
                        ? 'bg-gradient-to-r from-pink-500 to-rose-400'
                        : questionTimeLeft > 25
                        ? 'bg-gradient-to-r from-amber-400 to-pink-500'
                        : 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse'
                    }`}
                    style={{ width: `${questionTimeLeft}%` }}
                  />
                </div>
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

            {/* Hint */}
            <div className="text-center text-xs text-slate-400 font-medium">
              🎈 แตะหรือคลิกที่ลูกโป่งคำตอบที่ถูกต้องภายใน 10 วินาทีก่อนลูกโป่งจะลอยลับขอบฟ้า!
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 shadow-lg shadow-pink-500/20">
              <Award className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">สิ้นสุดเกมลูกโป่ง!</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                คุณคำนวณและระเบิดลูกโป่งได้อย่างยอดเยี่ยม
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-pink-900/50 space-y-2 font-mono">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">คะแนนรอบนี้:</span>
                <span className="text-pink-400 font-bold text-lg">{score.toLocaleString()} แต้ม</span>
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

