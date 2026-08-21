import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Flame, RefreshCw, Award, Sparkles, Zap, Shield, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateIntegerProblem, GameMathProblem } from '../../utils/gameMathGenerator';
import { soundFx } from '../../services/sound';
import { getGameHighScore, saveGameHighScore } from '../../utils/gameHighScore';
import { GameRecord } from '../../types';

interface VolcanoEscapeGameProps {
  onBack: () => void;
  onSaveScore?: (score: number, details: string, resultData?: Partial<GameRecord>) => void;
}

export const VolcanoEscapeGame: React.FC<VolcanoEscapeGameProps> = ({ onBack, onSaveScore }) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getGameHighScore('volcano_escape'));
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const totalRounds = 10;
  const [timeLeft, setTimeLeft] = useState<number>(100); // 10s
  const [currentProblem, setCurrentProblem] = useState<GameMathProblem | null>(null);
  const [jumpFeedback, setJumpFeedback] = useState<{ active: boolean; idx: number; correct: boolean } | null>(null);
  const [lavaHeight, setLavaHeight] = useState<number>(15);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const spawnProblem = (r: number) => {
    if (r > totalRounds) {
      endGame(score);
      return;
    }
    const prob = generateIntegerProblem('mixed', r > 5 ? 'hard' : 'medium');
    setCurrentProblem(prob);
    setTimeLeft(100);
    setJumpFeedback(null);
    setLavaHeight(15 + (r - 1) * 3);
  };

  const startGame = () => {
    soundFx.playPowerup();
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setRound(1);
    setGameState('playing');
    spawnProblem(1);
  };

  // 10s timer per question
  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleLavaTimeout();
          return 0;
        }
        if (prev === 30 || prev === 20 || prev === 10) {
          soundFx.playCountdown();
        }
        return prev - 1;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, round]);

  const handleLavaTimeout = () => {
    soundFx.playExplosion();
    setCombo(0);
    setJumpFeedback({ active: true, idx: -1, correct: false });

    setTimeout(() => {
      setRound((r) => {
        const nextR = r + 1;
        spawnProblem(nextR);
        return nextR;
      });
    }, 600);
  };

  const handleJumpToPlatform = (val: number, idx: number) => {
    if (gameState !== 'playing' || jumpFeedback || !currentProblem) return;

    const isCorrect = val === currentProblem.answer;

    setJumpFeedback({
      active: true,
      idx,
      correct: isCorrect,
    });

    if (isCorrect) {
      soundFx.playCorrect();

      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);

      const timeBonus = Math.round(timeLeft * 0.85);
      const comboBonus = nextCombo * 25;
      const pts = 120 + timeBonus + comboBonus;
      const newScore = score + pts;
      setScore(newScore);

      // Lava Fire Confetti
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { x: 0.25 + idx * 0.18, y: 0.6 },
        colors: ['#F97316', '#EF4444', '#FBBF24', '#DC2626', '#FFFFFF'],
      });

      if (newScore > highScore) {
        setHighScore(newScore);
        saveGameHighScore('volcano_escape', newScore);
      }

      setTimeout(() => {
        setJumpFeedback(null);
        setRound((r) => {
          const nextR = r + 1;
          spawnProblem(nextR);
          return nextR;
        });
      }, 700);
    } else {
      soundFx.playWrong();
      setCombo(0);
      setTimeout(() => {
        setJumpFeedback(null);
      }, 500);
    }
  };

  const endGame = (finalScore: number) => {
    setGameState('gameover');
    soundFx.playFanfare();

    const newHigh = saveGameHighScore('volcano_escape', finalScore);
    setHighScore(newHigh);

    if (onSaveScore) {
      onSaveScore(finalScore, `หนีลาวาภูเขาไฟเดือด: ได้คะแนน ${finalScore} แต้ม`, {
        highScore: newHigh,
        maxCombo,
      });
    }
  };

  return (
    <div
      className={`relative w-full max-w-3xl mx-auto bg-slate-950 text-white rounded-3xl border-2 transition-all duration-300 shadow-2xl overflow-hidden min-h-[580px] flex flex-col select-none ${
        jumpFeedback?.correct
          ? 'border-orange-400 ring-8 ring-orange-500/90 shadow-[0_0_55px_#f97316]'
          : jumpFeedback && !jumpFeedback.correct
          ? 'border-rose-500 ring-8 ring-rose-500/80 shadow-[0_0_50px_#ef4444]'
          : 'border-orange-500/40 shadow-orange-950/50'
      }`}
    >
      {/* Lava Glow Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_90%,rgba(239,68,68,0.25),transparent_70%)] pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-orange-500/20 bg-slate-950/80 backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-slate-500"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับฮับเกม</span>
        </button>

        <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-mono">
          <div className="flex items-center gap-1 text-orange-400 font-bold">
            <span>🌋 แท่นหิน {round} / {totalRounds}</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-300 font-bold">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>{score.toLocaleString()}</span>
          </div>

          {combo > 1 && (
            <div className="flex items-center gap-1 text-orange-300 font-extrabold animate-bounce">
              <Flame className="w-4 h-4 text-red-500" />
              <span>{combo}x คอมโบ</span>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-4 sm:p-6">
        {gameState === 'ready' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-orange-500/20 border-2 border-orange-400 flex items-center justify-center text-4xl shadow-[0_0_35px_rgba(249,115,22,0.6)] animate-pulse">
              🌋
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400 text-orange-300 text-xs font-bold uppercase tracking-widest">
                Volcano Escape • เกมที่ 13
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                หนีลาวาภูเขาไฟเดือด (Volcano Escape)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                ลาวาร้อนระอุทะลักขึ้นอย่างรวดเร็ว! กระโดดข้ามแท่นหินอัคนีตัวเลขที่คำนวณถูกต้องเพื่อไต่ระดับหนีให้ทันภายใน 10 วินาทีก่อนลาวากลืนกิน!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-orange-500/30 text-xs text-slate-300 space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <span className="text-orange-400 font-bold">🌋 แท่นหิน:</span> แท่นหินเรืองแสงทนความร้อนสูง
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-300 font-bold">⏱️ กฎเวลา:</span> 10 ข้อ ข้อละ 10 วินาที พร้อมเอฟเฟกต์ไฟลาวาปะทุ
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-red-600 to-amber-600 hover:from-orange-400 hover:to-red-500 text-white font-black text-base shadow-[0_0_35px_rgba(239,68,68,0.7)] active:scale-95 transition"
            >
              🌋 เริ่มกระโดดหนีลาวา (ESCAPE NOW)
            </button>
          </div>
        )}

        {gameState === 'playing' && currentProblem && (
          <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full py-1">
            {/* HUD Target */}
            <div className="space-y-2 text-center">
              <div className="inline-block px-5 py-2.5 rounded-2xl bg-slate-900/90 border border-orange-500/50 shadow-[0_0_25px_rgba(249,115,22,0.35)] backdrop-blur-md">
                <span className="text-[11px] uppercase tracking-widest text-orange-400 font-bold block mb-0.5">
                  แท่นหินที่ {round} / {totalRounds}
                </span>
                <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wider">
                  {currentProblem.expression} = ?
                </span>
              </div>

              {/* 10s Lava Rising Bar */}
              <div className="space-y-1 max-w-xs mx-auto">
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span className="text-red-400 font-bold">ระดับลาวาคุกรุ่น</span>
                  <span className={`font-bold ${timeLeft <= 30 ? 'text-rose-400 animate-pulse' : 'text-orange-300'}`}>
                    🌋 {(timeLeft / 10).toFixed(1)}s / 10s
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700">
                  <div
                    className={`h-full transition-all duration-100 ${
                      timeLeft > 50
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : timeLeft > 25
                        ? 'bg-gradient-to-r from-orange-500 to-red-500'
                        : 'bg-gradient-to-r from-red-600 to-rose-700 animate-pulse'
                    }`}
                    style={{ width: `${timeLeft}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Volcano Arena & 4 Lava Stepping Stones */}
            <div className="relative min-h-[250px] sm:min-h-[270px] my-2 rounded-3xl bg-slate-950/85 border border-orange-500/30 overflow-hidden shadow-inner flex flex-col justify-between p-3.5 sm:p-4">
              {/* Molten Lava Floor */}
              <div
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-red-600 via-orange-600 to-yellow-500/30 pointer-events-none transition-all duration-300"
                style={{ height: `${lavaHeight}%` }}
              >
                <div className="absolute top-0 inset-x-0 h-2 bg-yellow-300/80 blur-xs animate-pulse" />
              </div>

              {/* 4 Floating Volcanic Platform Stones */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 z-20 my-auto">
                {currentProblem.options.slice(0, 4).map((opt, idx) => {
                  const isJumpTarget = jumpFeedback && jumpFeedback.idx === idx;
                  return (
                    <div key={idx} className="relative flex flex-col items-center">
                      <button
                        onClick={() => handleJumpToPlatform(opt, idx)}
                        disabled={!!jumpFeedback}
                        className={`relative w-full h-20 sm:h-24 rounded-2xl border-2 font-mono font-black text-base sm:text-xl flex flex-col items-center justify-center p-1.5 sm:p-2 transition-all duration-200 cursor-pointer shadow-lg active:scale-95 ${
                          isJumpTarget
                            ? jumpFeedback.correct
                              ? 'bg-gradient-to-b from-orange-400 via-amber-500 to-red-600 border-yellow-200 text-white shadow-[0_0_40px_#f97316] scale-105 ring-4 ring-orange-300'
                              : 'bg-stone-900 border-rose-500 text-rose-300 shadow-[0_0_30px_#ef4444] scale-95'
                            : 'bg-gradient-to-b from-stone-900 to-stone-950 hover:from-stone-800 hover:to-stone-900 border-orange-500/40 hover:border-orange-300 text-orange-200 hover:shadow-[0_0_25px_rgba(249,115,22,0.6)]'
                        }`}
                      >
                        <div className="text-[10px] text-orange-400/80 mb-0.5 flex items-center gap-0.5 font-sans">
                          <span>🪨 แท่นที่ {idx + 1}</span>
                        </div>
                        <span className="text-lg sm:text-2xl font-black">{opt}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="text-center text-[11px] text-orange-300 font-mono z-10 mt-1">
                🔥 แตะแท่นหินอัคนีตัวเลขที่ถูกต้องเพื่อกระโดดหนีลาวา!
              </div>
            </div>

            <div className="text-center text-xs text-slate-400 font-medium">
              🌋 ว่องไวและเด็ดขาด กระโดดข้ามแท่นหินก่อนระดับลาวาจะกลืนกิน!
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-orange-500/20 border-2 border-orange-400 flex items-center justify-center text-orange-400 shadow-[0_0_35px_rgba(249,115,22,0.5)]">
              <Award className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">หลบหนีลาวาสำเร็จ!</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                คุณเอาชีวิตรอดจากภูเขาไฟเดือดด้วยการคำนวณจำนวนเต็มสุดเฉียบคม
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-orange-500/40 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">คะแนนการเอาชีวิตรอด:</span>
                <span className="text-orange-400 font-bold text-lg">{score.toLocaleString()} แต้ม</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">คอมโบสูงสุด:</span>
                <span className="text-yellow-300 font-bold">{maxCombo}x</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">สถิติสูงสุด:</span>
                <span className="text-yellow-400 font-bold">{highScore.toLocaleString()} แต้ม</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-black text-sm shadow-lg shadow-orange-500/30 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>เล่นใหม่อีกครั้ง</span>
              </button>
              <button
                onClick={onBack}
                className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition"
              >
                กลับหน้าหลัก
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
