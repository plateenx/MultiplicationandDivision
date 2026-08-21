import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Flame, RefreshCw, Award, Sparkles, Zap, Shield, Swords } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateIntegerProblem, GameMathProblem } from '../../utils/gameMathGenerator';
import { soundFx } from '../../services/sound';
import { getGameHighScore, saveGameHighScore } from '../../utils/gameHighScore';
import { GameRecord } from '../../types';

interface ThunderStrikerGameProps {
  onBack: () => void;
  onSaveScore?: (score: number, details: string, resultData?: Partial<GameRecord>) => void;
}

export const ThunderStrikerGame: React.FC<ThunderStrikerGameProps> = ({ onBack, onSaveScore }) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getGameHighScore('thunder_striker'));
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const totalRounds = 10;
  const [timeLeft, setTimeLeft] = useState<number>(100); // 10s countdown
  const [currentProblem, setCurrentProblem] = useState<GameMathProblem | null>(null);
  const [lightningFlash, setLightningFlash] = useState<{ active: boolean; targetIdx: number; correct: boolean } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const spawnProblem = (r: number) => {
    if (r > totalRounds) {
      endGame(score);
      return;
    }
    const prob = generateIntegerProblem('mixed', r > 5 ? 'hard' : 'medium');
    setCurrentProblem(prob);
    setTimeLeft(100);
    setLightningFlash(null);
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

  // 10s countdown timer per question
  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
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

  const handleTimeout = () => {
    soundFx.playWrong();
    setCombo(0);
    setLightningFlash({ active: true, targetIdx: -1, correct: false });

    setTimeout(() => {
      setRound((r) => {
        const nextR = r + 1;
        spawnProblem(nextR);
        return nextR;
      });
    }, 600);
  };

  const handleStrike = (val: number, idx: number) => {
    if (gameState !== 'playing' || lightningFlash || !currentProblem) return;

    const isCorrect = val === currentProblem.answer;

    setLightningFlash({
      active: true,
      targetIdx: idx,
      correct: isCorrect,
    });

    if (isCorrect) {
      soundFx.playLaser();
      soundFx.playCorrect();

      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);

      const timeBonus = Math.round(timeLeft * 0.9);
      const comboBonus = nextCombo * 30;
      const pts = 120 + timeBonus + comboBonus;
      const newScore = score + pts;
      setScore(newScore);

      // Gold-Electric Confetti
      confetti({
        particleCount: 50,
        spread: 90,
        origin: { x: 0.25 + idx * 0.18, y: 0.5 },
        colors: ['#FBBF24', '#F59E0B', '#EAB308', '#FFFFFF', '#60A5FA'],
      });

      if (newScore > highScore) {
        setHighScore(newScore);
        saveGameHighScore('thunder_striker', newScore);
      }

      setTimeout(() => {
        setLightningFlash(null);
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
        setLightningFlash(null);
      }, 500);
    }
  };

  const endGame = (finalScore: number) => {
    setGameState('gameover');
    soundFx.playFanfare();

    const newHigh = saveGameHighScore('thunder_striker', finalScore);
    setHighScore(newHigh);

    if (onSaveScore) {
      onSaveScore(finalScore, `สายฟ้าพิฆาตอสูร: ได้คะแนน ${finalScore} แต้ม`, {
        highScore: newHigh,
        maxCombo,
      });
    }
  };

  return (
    <div
      className={`relative w-full max-w-3xl mx-auto bg-slate-950 text-white rounded-3xl border-2 transition-all duration-300 shadow-2xl overflow-hidden min-h-[580px] flex flex-col select-none ${
        lightningFlash?.correct
          ? 'border-amber-300 ring-8 ring-amber-400/90 shadow-[0_0_55px_#f59e0b]'
          : lightningFlash && !lightningFlash.correct
          ? 'border-rose-500 ring-8 ring-rose-500/80 shadow-[0_0_50px_#f43f5e]'
          : 'border-amber-500/40 shadow-amber-950/50'
      }`}
    >
      {/* Dynamic Storm Lightning Canvas */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.18),transparent_65%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(15,23,42,0.9)_100%)] pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-amber-500/20 bg-slate-950/80 backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-slate-500"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับฮับเกม</span>
        </button>

        <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-mono">
          <div className="flex items-center gap-1 text-amber-400 font-bold">
            <span>⚡ ข้อ {round} / {totalRounds}</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-300 font-bold">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>{score.toLocaleString()}</span>
          </div>

          {combo > 1 && (
            <div className="flex items-center gap-1 text-amber-300 font-extrabold animate-bounce">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>{combo}x สตรีค</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-4 sm:p-6">
        {gameState === 'ready' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl shadow-[0_0_35px_rgba(245,158,11,0.6)] animate-pulse">
              ⚡
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold uppercase tracking-widest">
                Thunder Striker • เกมที่ 12
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                สายฟ้าพิฆาตอสูร (Thunder Striker)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                อัญเชิญพลังสายฟ้าฟาดจากฟากฟ้า! คำนวณโจทย์การคูณและการหารจำนวนเต็ม แล้วสั่งสายฟ้าฟาดลงบนเสาพลังงานตัวเลขที่ถูกต้องให้ทันใน 10 วินาที!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-xs text-slate-300 space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">⚡ สกิล:</span> ผ่าสายฟ้านีออนสีทองอร่ามทำลายเสาพลังงาน
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-300 font-bold">⏱️ กฎเวลา:</span> 10 ข้อ ข้อละ 10 วินาที พร้อมคะแนนโบนัสความไว
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-base shadow-[0_0_35px_rgba(245,158,11,0.7)] active:scale-95 transition"
            >
              ⚡ ร่ายพลังสายฟ้า (SUMMON THUNDER)
            </button>
          </div>
        )}

        {gameState === 'playing' && currentProblem && (
          <div className="relative flex-1 flex flex-col justify-between max-w-lg mx-auto w-full py-1">
            {/* HUD Target Problem */}
            <div className="relative space-y-2 text-center z-20">
              <div
                className={`relative inline-block px-5 py-2.5 rounded-2xl bg-slate-900/95 border transition-all duration-150 backdrop-blur-md ${
                  lightningFlash
                    ? lightningFlash.correct
                      ? 'border-yellow-300 ring-4 ring-yellow-400/90 shadow-[0_0_45px_#f59e0b] scale-105'
                      : 'border-rose-500 ring-4 ring-rose-500/80 shadow-[0_0_35px_#f43f5e]'
                    : 'border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.35)]'
                }`}
              >
                {/* Electric Sparks on Problem Box when striking */}
                {lightningFlash && (
                  <div className="absolute inset-0 rounded-2xl bg-yellow-400/20 animate-ping pointer-events-none" />
                )}

                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="text-[11px] uppercase tracking-widest text-amber-400 font-bold">
                    ⚡ พลังสายฟ้าผ่าโจทย์ข้อที่ {round} / {totalRounds}
                  </span>
                  {lightningFlash && <span className="text-yellow-300 text-xs animate-bounce">⚡⚡⚡</span>}
                </div>

                <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wider">
                  {currentProblem.expression} = ?
                </span>
              </div>

              {/* 10s Thunder Charge Bar */}
              <div className="space-y-1 max-w-xs mx-auto">
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span>ประจุสายฟ้า</span>
                  <span className={`font-bold ${timeLeft <= 30 ? 'text-rose-400 animate-pulse' : 'text-amber-300'}`}>
                    ⚡ {(timeLeft / 10).toFixed(1)}s / 10s
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700">
                  <div
                    className={`h-full transition-all duration-100 ${
                      timeLeft > 50
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                        : timeLeft > 25
                        ? 'bg-gradient-to-r from-orange-400 to-amber-500'
                        : 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse'
                    }`}
                    style={{ width: `${timeLeft}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Storm Sky & 4 Lightning Pillars with Real Lightning Arc from Problem HUD */}
            <div className="relative min-h-[260px] sm:min-h-[280px] my-2 rounded-3xl bg-slate-950/85 border border-amber-500/30 overflow-hidden shadow-inner flex flex-col justify-between p-3.5 sm:p-4">
              {/* Massive Full-Width Screen Flash on Strike */}
              {lightningFlash && (
                <div className="absolute inset-0 bg-yellow-300/25 pointer-events-none z-30 animate-pulse" />
              )}

              {/* Dynamic SVG Lightning Bolts Shooting Down from Problem HUD to Struck Pillar */}
              {lightningFlash && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-40 overflow-visible"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <filter id="lightning-glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <linearGradient id="bolt-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="50%" stopColor="#fef08a" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>

                  {/* Calculate X target for pillar (12.5%, 37.5%, 62.5%, 87.5%) */}
                  {(() => {
                    const targetX = 12.5 + lightningFlash.targetIdx * 25;
                    const startX = 50; // Centered at the problem HUD top
                    const midX1 = startX + (targetX - startX) * 0.3 + (Math.random() > 0.5 ? 4 : -4);
                    const midX2 = startX + (targetX - startX) * 0.65 + (Math.random() > 0.5 ? -5 : 5);
                    const midX3 = targetX + (Math.random() > 0.5 ? 3 : -3);

                    const mainPath = `M ${startX} 0 L ${midX1} 25 L ${midX2} 55 L ${midX3} 80 L ${targetX} 92`;
                    const forkPath1 = `M ${midX1} 25 L ${midX1 + (targetX > startX ? 8 : -8)} 45 L ${midX1 + (targetX > startX ? 12 : -12)} 65`;
                    const forkPath2 = `M ${midX2} 55 L ${midX2 + (targetX > startX ? -6 : 6)} 75`;

                    return (
                      <g filter="url(#lightning-glow)">
                        {/* Outer Glow Halo */}
                        <path
                          d={mainPath}
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-90 animate-pulse"
                        />
                        {/* Core White Energy Line */}
                        <path
                          d={mainPath}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Side Electric Branches */}
                        <path
                          d={forkPath1}
                          fill="none"
                          stroke="#fde047"
                          strokeWidth="1"
                          strokeLinecap="round"
                          className="opacity-75"
                        />
                        <path
                          d={forkPath2}
                          fill="none"
                          stroke="#fde047"
                          strokeWidth="0.8"
                          strokeLinecap="round"
                          className="opacity-60"
                        />
                        {/* Ground Lightning Impact Burst */}
                        <circle
                          cx={targetX}
                          cy="92"
                          r="6"
                          fill="#ffffff"
                          stroke="#f59e0b"
                          strokeWidth="2"
                          className="animate-ping"
                        />
                      </g>
                    );
                  })()}
                </svg>
              )}

              {/* Storm Cloud Top */}
              <div className="text-center mb-1 relative z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold animate-pulse">
                  <span>⛈️ พายุเมฆฟ้าคะนองรุนแรง • ประจุไฟฟ้าสะสม</span>
                </div>
              </div>

              {/* 4 Lightning Rod Pillars */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 z-20 my-auto">
                {currentProblem.options.slice(0, 4).map((opt, idx) => {
                  const isStruck = lightningFlash && lightningFlash.targetIdx === idx;
                  return (
                    <div key={idx} className="relative flex flex-col items-center">
                      {/* Vertical Lightning Sparks at Impact */}
                      {isStruck && (
                        <div className="absolute -top-12 inset-x-0 flex flex-col items-center z-30 pointer-events-none">
                          <div className="text-2xl animate-bounce">⚡💥</div>
                          <div className="text-[10px] font-black text-amber-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-amber-400 shadow-[0_0_15px_#f59e0b]">
                            STRIKE!
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => handleStrike(opt, idx)}
                        disabled={!!lightningFlash}
                        className={`relative w-full h-20 sm:h-24 rounded-2xl border-2 font-mono font-black text-base sm:text-xl flex flex-col items-center justify-center p-1.5 sm:p-2 transition-all duration-150 cursor-pointer shadow-lg active:scale-95 ${
                          isStruck
                            ? lightningFlash.correct
                              ? 'bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 border-white text-slate-950 shadow-[0_0_45px_#f59e0b] scale-105 ring-4 ring-amber-300 z-30'
                              : 'bg-rose-950 border-rose-400 text-rose-200 shadow-[0_0_30px_#f43f5e] scale-95'
                            : 'bg-slate-900/90 hover:bg-slate-850 border-amber-500/40 hover:border-amber-300 text-amber-200 hover:shadow-[0_0_25px_rgba(245,158,11,0.6)]'
                        }`}
                      >
                        <div className="text-[10px] text-amber-400/80 mb-0.5 flex items-center gap-0.5 font-sans">
                          <span>เสาที่ {idx + 1}</span>
                        </div>
                        <span className="text-lg sm:text-2xl font-black">{opt}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="text-center text-[11px] text-amber-400/80 font-mono mt-1 z-10">
                ⚡ แตะเสาเพื่อผ่าสายฟ้าจากโจทย์ฟาดลงเป้าหมายที่ถูกต้อง!
              </div>
            </div>

            <div className="text-center text-xs text-slate-400 font-medium">
              ⚡ สั่งการสายฟ้าฟาดจากโจทย์ลงสู่เสาพลังงาน คิดคำนวณอย่างว่องไว!
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.5)]">
              <Award className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">การควบคุมสายฟ้าสำเร็จ!</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                คุณสั่งการสายฟ้าและคิดคำนวณจำนวนเต็มได้อย่างแม่นยำ
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">คะแนนพลังสายฟ้า:</span>
                <span className="text-amber-400 font-bold text-lg">{score.toLocaleString()} แต้ม</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">สตรีคสูงสุด:</span>
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
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30 transition flex items-center justify-center gap-2"
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
