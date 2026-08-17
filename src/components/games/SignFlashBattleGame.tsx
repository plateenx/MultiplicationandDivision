import React, { useState, useEffect, useRef } from 'react';
import { Zap, Timer, Flame, Trophy, RefreshCw, ArrowLeft, Award, CheckCircle2, XCircle, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateIntegerProblem, GameMathProblem } from '../../utils/gameMathGenerator';
import { soundFx } from '../../services/sound';
import { getGameHighScore, saveGameHighScore } from '../../utils/gameHighScore';
import { GameRecord } from '../../types';

interface SignFlashBattleGameProps {
  onBack: () => void;
  onSaveScore?: (score: number, details: string, resultData?: Partial<GameRecord>) => void;
}

export const SignFlashBattleGame: React.FC<SignFlashBattleGameProps> = ({ onBack, onSaveScore }) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getGameHighScore('sign_flash'));
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [currentProblem, setCurrentProblem] = useState<GameMathProblem | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; sign: string } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextProblem = () => {
    // Generate high speed problem
    const prob = generateIntegerProblem('mixed', streak > 5 ? 'hard' : 'medium');
    setCurrentProblem(prob);
  };

  const startGame = () => {
    soundFx.playPowerup();
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setTotalCount(0);
    setTimeLeft(30);
    setGameState('playing');
    nextProblem();
  };

  // Game countdown timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame(score);
          return 0;
        }
        if (t <= 6) {
          soundFx.playCountdown();
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, score]);

  const handleChooseSign = (chosenSign: '+' | '-' | '0') => {
    if (gameState !== 'playing' || !currentProblem) return;

    setTotalCount((c) => c + 1);

    if (chosenSign === currentProblem.sign) {
      // Correct!
      soundFx.playCorrect();
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      soundFx.playCombo(newStreak);

      const multiplier = newStreak >= 5 ? 2 : 1;
      const points = (50 + Math.min(newStreak * 10, 100)) * multiplier;
      const newScore = score + points;
      setScore(newScore);

      if (newScore > highScore) {
        setHighScore(newScore);
        saveGameHighScore('sign_flash', newScore);
      }

      setCorrectCount((c) => c + 1);

      setFeedback({ type: 'correct', sign: chosenSign });
      setTimeout(() => setFeedback(null), 300);

      nextProblem();
    } else {
      // Wrong!
      soundFx.playWrong();
      setStreak(0);
      setFeedback({ type: 'wrong', sign: chosenSign });
      setTimeout(() => setFeedback(null), 400);
      nextProblem();
    }
  };

  const endGame = (finalScore: number) => {
    setGameState('gameover');
    soundFx.playFanfare();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    const newHigh = saveGameHighScore('sign_flash', finalScore);
    setHighScore(newHigh);

    const t = Math.max(1, totalCount);
    const acc = Math.round((correctCount / t) * 100);

    if (onSaveScore) {
      onSaveScore(
        finalScore,
        `ประลองสปีดเครื่องหมาย: ${finalScore} แต้ม (ตอบถูก ${correctCount}/${t} ข้อ, Streak ${maxStreak})`,
        {
          highScore: newHigh,
          correctCount: correctCount,
          totalQuestions: t,
          accuracyPercentage: acc,
          maxCombo: maxStreak,
          timeSpentSeconds: 30,
          details: `ตอบถูก ${correctCount}/${t} ข้อ (ความแม่นยำ ${acc}%), Streak x${maxStreak} ใน 30 วินาที`,
          specialMetrics: {
            signs_correct: correctCount,
            signs_total: t,
            max_streak: maxStreak,
            duration_sec: 30,
          },
        }
      );
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto bg-slate-950 text-white rounded-3xl border border-amber-500/30 shadow-2xl overflow-hidden min-h-[540px] flex flex-col select-none">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/40 via-slate-950 to-black pointer-events-none" />

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
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Timer className={`w-4 h-4 ${timeLeft <= 5 ? 'animate-ping text-rose-500' : ''}`} />
            <span className={timeLeft <= 5 ? 'text-rose-400 font-black' : ''}>{timeLeft}s</span>
          </div>

          <div className="flex items-center gap-1.5 text-yellow-300 font-bold">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>{score.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-950/50 px-2.5 py-1 rounded-xl border border-yellow-500/30 text-[11px] sm:text-xs">
            <Crown className="w-3.5 h-3.5 text-yellow-400" />
            <span>สูงสุด: {highScore.toLocaleString()}</span>
          </div>

          {streak >= 3 && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white font-extrabold text-[11px] animate-bounce shadow-md">
              <Flame className="w-3.5 h-3.5 fill-white" />
              <span>{streak} COMBO</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-4 sm:p-6">
        {gameState === 'ready' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <Zap className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-white bg-clip-text text-transparent">
                ประลองสปีดเครื่องหมาย (Sign Rush)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                ดูโจทย์แล้วตัดสินใจอย่างรวดเร็ว ผลลัพธ์สุดท้ายเป็น <strong>[ + บวก ]</strong> หรือ <strong>[ - ลบ ]</strong> หรือ <strong>[ 0 ศูนย์ ]</strong> ทำเวลาให้มากที่สุดใน 30 วินาที!
              </p>
            </div>

            {/* High Score Banner on Ready */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-sm font-bold">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span>คะแนนสูงสุด: {highScore.toLocaleString()} แต้ม</span>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-base shadow-lg shadow-amber-500/30 active:scale-95 transition"
            >
              ⚡ เริ่มประลองความไว (START)
            </button>
          </div>
        )}

        {gameState === 'playing' && currentProblem && (
          <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full py-2">
            {/* Streak Fever Banner */}
            <div className="text-center min-h-[28px]">
              {streak >= 5 ? (
                <span className="px-3 py-1 rounded-full bg-rose-500/30 border border-rose-500 text-rose-300 font-extrabold text-xs tracking-wider animate-pulse">
                  🔥 FEVER MODE! คะแนนคูณ 2x
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-medium">
                  ตอบถูกติดต่อกัน {streak} ข้อ
                </span>
              )}
            </div>

            {/* Expression Box */}
            <div className="relative text-center my-auto py-6">
              {feedback && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-bounce">
                  {feedback.type === 'correct' ? (
                    <span className="text-2xl font-black text-emerald-400 drop-shadow-md">
                      ✓ ถูกต้อง!
                    </span>
                  ) : (
                    <span className="text-2xl font-black text-rose-400 drop-shadow-md">
                      ✗ ผิด! (คำตอบคือ {currentProblem.sign})
                    </span>
                  )}
                </div>
              )}

              <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border-2 border-amber-500/40 shadow-2xl shadow-amber-950/60 backdrop-blur-md">
                <span className="text-xs uppercase tracking-widest text-amber-400 font-bold block mb-2">
                  วิเคราะห์เครื่องหมายของผลลัพธ์
                </span>
                <span className="text-4xl sm:text-5xl font-mono font-black text-white tracking-wider block">
                  {currentProblem.expression}
                </span>
              </div>
            </div>

            {/* Sign Decision Buttons */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <button
                onClick={() => handleChooseSign('+')}
                className="py-6 rounded-2xl bg-gradient-to-b from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-mono font-black text-3xl sm:text-4xl shadow-lg shadow-emerald-950/50 border border-emerald-400/40 active:scale-95 transition flex flex-col items-center justify-center gap-1"
              >
                <span>+</span>
                <span className="text-[11px] font-sans font-bold text-emerald-200">เป็นบวก (+)</span>
              </button>

              <button
                onClick={() => handleChooseSign('-')}
                className="py-6 rounded-2xl bg-gradient-to-b from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 text-white font-mono font-black text-3xl sm:text-4xl shadow-lg shadow-rose-950/50 border border-rose-400/40 active:scale-95 transition flex flex-col items-center justify-center gap-1"
              >
                <span>-</span>
                <span className="text-[11px] font-sans font-bold text-rose-200">เป็นลบ (-)</span>
              </button>

              <button
                onClick={() => handleChooseSign('0')}
                className="py-6 rounded-2xl bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-mono font-black text-3xl sm:text-4xl shadow-lg shadow-slate-950/50 border border-slate-500/40 active:scale-95 transition flex flex-col items-center justify-center gap-1"
              >
                <span>0</span>
                <span className="text-[11px] font-sans font-bold text-slate-300">เป็นศูนย์ (0)</span>
              </button>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <Award className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">หมดเวลา!</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                การวิเคราะห์เครื่องหมายของคุณรวดเร็วมาก!
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
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">ความแม่นยำ:</span>
                <span className="text-emerald-300 font-bold">
                  {correctCount} / {totalCount} ข้อ ({totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0}%)
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Streak สูงสุด:</span>
                <span className="text-orange-300 font-bold">{maxStreak} ข้อติด</span>
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

