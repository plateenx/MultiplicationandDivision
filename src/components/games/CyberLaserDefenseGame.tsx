import React, { useState, useEffect, useRef } from 'react';
import { Shield, Sparkles, RefreshCw, Trophy, Heart, Award, ArrowLeft, Zap, Flame, ShieldAlert, Crosshair } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateIntegerProblem, GameMathProblem } from '../../utils/gameMathGenerator';
import { soundFx } from '../../services/sound';
import { getGameHighScore, saveGameHighScore } from '../../utils/gameHighScore';
import { GameRecord } from '../../types';

interface CyberLaserDefenseGameProps {
  onBack: () => void;
  onSaveScore?: (score: number, details: string, resultData?: Partial<GameRecord>) => void;
}

export const CyberLaserDefenseGame: React.FC<CyberLaserDefenseGameProps> = ({ onBack, onSaveScore }) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getGameHighScore('cyber_defense'));
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [baseHp, setBaseHp] = useState<number>(100);
  const [round, setRound] = useState<number>(1);
  const totalRounds = 10;
  const [timeLeft, setTimeLeft] = useState<number>(100); // 100 ticks = 10s
  const [currentProblem, setCurrentProblem] = useState<GameMathProblem | null>(null);
  const [laserBeam, setLaserBeam] = useState<{ active: boolean; targetIdx: number; isCorrect: boolean } | null>(null);
  const [screenFlash, setScreenFlash] = useState<'green' | 'red' | null>(null);
  const [missileY, setMissileY] = useState<number>(10); // missile descends from 10% to 80%

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  const spawnProblem = (r: number) => {
    if (r > totalRounds) {
      endGame(score, true);
      return;
    }
    const prob = generateIntegerProblem('mixed', r > 6 ? 'hard' : 'medium');
    setCurrentProblem(prob);
    setTimeLeft(100);
    setMissileY(10);
    setLaserBeam(null);
  };

  const startGame = () => {
    soundFx.playPowerup();
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setBaseHp(100);
    setRound(1);
    setGameState('playing');
    spawnProblem(1);
  };

  // 10s countdown & Missile Descending
  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time out! Missile hits base!
          handleBaseHit();
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

  // Missile Y descent animation
  useEffect(() => {
    if (gameState !== 'playing') return;
    setMissileY(10 + ((100 - timeLeft) / 100) * 65);
  }, [timeLeft, gameState]);

  const handleBaseHit = () => {
    soundFx.playExplosion();
    setScreenFlash('red');
    setBaseHp((hp) => {
      const nextHp = Math.max(0, hp - 35);
      if (nextHp <= 0) {
        setTimeout(() => endGame(score, false), 500);
      } else {
        setTimeout(() => {
          setScreenFlash(null);
          setRound((r) => {
            const nextR = r + 1;
            spawnProblem(nextR);
            return nextR;
          });
        }, 600);
      }
      return nextHp;
    });
    setCombo(0);
  };

  const handleFireLaser = (selectedOption: number, targetIdx: number) => {
    if (gameState !== 'playing' || laserBeam || !currentProblem) return;

    const isCorrect = selectedOption === currentProblem.answer;

    // Trigger Laser Beam Effect
    setLaserBeam({
      active: true,
      targetIdx,
      isCorrect,
    });

    if (isCorrect) {
      soundFx.playLaser();
      soundFx.playCorrect();
      setScreenFlash('green');

      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);

      const timeBonus = Math.round(timeLeft * 0.8);
      const comboBonus = nextCombo * 25;
      const pts = 120 + timeBonus + comboBonus;
      const newScore = score + pts;
      setScore(newScore);

      // Confetti burst from target drone
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { x: 0.25 + targetIdx * 0.18, y: 0.35 },
        colors: ['#06B6D4', '#3B82F6', '#10B981', '#F59E0B', '#FFFFFF'],
      });

      if (newScore > highScore) {
        setHighScore(newScore);
        saveGameHighScore('cyber_defense', newScore);
      }

      setTimeout(() => {
        setScreenFlash(null);
        setLaserBeam(null);
        setRound((r) => {
          const nextR = r + 1;
          spawnProblem(nextR);
          return nextR;
        });
      }, 700);
    } else {
      // Wrong calculation! Laser deflected & Base shield damaged
      soundFx.playWrong();
      setScreenFlash('red');
      setCombo(0);
      setBaseHp((hp) => Math.max(0, hp - 20));

      setTimeout(() => {
        setScreenFlash(null);
        setLaserBeam(null);
      }, 500);
    }
  };

  const endGame = (finalScore: number, survived: boolean) => {
    setGameState('gameover');
    if (survived) {
      soundFx.playFanfare();
    } else {
      soundFx.playGameOver();
    }

    const newHigh = saveGameHighScore('cyber_defense', finalScore);
    setHighScore(newHigh);

    if (onSaveScore) {
      onSaveScore(
        finalScore,
        `ไซเบอร์เลเซอร์ดีเฟนส์: ${finalScore} แต้ม (${survived ? 'ฐานทัพปลอดภัย 100%' : 'ฐานทัพถูกทำลาย'})`,
        {
          highScore: newHigh,
          maxCombo,
        }
      );
    }
  };

  return (
    <div
      className={`relative w-full max-w-3xl mx-auto bg-slate-950 text-white rounded-3xl border-2 transition-all duration-300 shadow-2xl overflow-hidden min-h-[580px] flex flex-col select-none ${
        screenFlash === 'green'
          ? 'border-emerald-400 ring-8 ring-emerald-500/80 shadow-[0_0_50px_#10b981]'
          : screenFlash === 'red'
          ? 'border-rose-500 ring-8 ring-rose-500/80 shadow-[0_0_50px_#f43f5e]'
          : 'border-cyan-500/40 shadow-cyan-950/50'
      }`}
    >
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(6,182,212,0.15),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(15,23,42,0.9)_100%)] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-slate-500"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับฮับเกม</span>
        </button>

        <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-mono">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
            <span>🛡️ HP ฐาน:</span>
            <div className="w-16 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-cyan-500/50">
              <div
                className={`h-full transition-all duration-300 ${
                  baseHp > 50 ? 'bg-cyan-400' : baseHp > 25 ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'
                }`}
                style={{ width: `${baseHp}%` }}
              />
            </div>
            <span>{baseHp}%</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-300 font-bold">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>{score.toLocaleString()}</span>
          </div>

          {combo > 1 && (
            <div className="flex items-center gap-1 text-pink-400 font-extrabold animate-bounce">
              <Flame className="w-4 h-4" />
              <span>{combo}x คอมโบ</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-4 sm:p-6">
        {gameState === 'ready' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(6,182,212,0.5)] animate-pulse">
              ⚡
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-bold uppercase tracking-widest">
                Cyber Defense • เกมที่ 11
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                ไซเบอร์เลเซอร์ดีเฟนส์ (Laser Defense)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                มิสไซล์กำลังพุ่งตรงเข้าถล่มฐานทัพไซเบอร์! เล็งป้อมปืนเลเซอร์ ยิงทำลายโดรนตัวเลขคำตอบที่ถูกต้องเพื่อสกัดกั้นมิสไซล์ให้ทันภายใน 10 วินาที!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 text-xs text-slate-300 space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold">⚡ อาวุธ:</span> ลำแสงเลเซอร์โฟตอน ทำลายเป้าหมายทันที
              </div>
              <div className="flex items-center gap-2">
                <span className="text-pink-400 font-bold">🎯 โจทย์:</span> การคูณ/การหารจำนวนเต็มแบบผสม 10 ภารกิจ
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-base shadow-[0_0_30px_rgba(6,182,212,0.6)] active:scale-95 transition"
            >
              ⚡ เริ่มเดินระบบป้อมปืน (START MISSION)
            </button>
          </div>
        )}

        {gameState === 'playing' && currentProblem && (
          <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full py-1">
            {/* Mission Target HUD */}
            <div className="space-y-2 text-center">
              <div className="inline-block px-5 py-2.5 rounded-2xl bg-slate-900/90 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-md">
                <span className="text-[11px] uppercase tracking-widest text-cyan-400 font-bold block mb-0.5">
                  ภารกิจสกัดกั้น {round} / {totalRounds}
                </span>
                <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wider">
                  {currentProblem.expression} = ?
                </span>
              </div>

              {/* 10-Second Missile Altitude Bar */}
              <div className="space-y-1 max-w-xs mx-auto">
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 text-rose-400 font-bold">
                    <Flame className="w-3.5 h-3.5" /> ระดับมิสไซล์
                  </span>
                  <span className={`font-bold ${timeLeft <= 30 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'}`}>
                    ⏳ {(timeLeft / 10).toFixed(1)}s / 10s
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700">
                  <div
                    className={`h-full transition-all duration-100 ${
                      timeLeft > 50
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        : timeLeft > 25
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                        : 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse'
                    }`}
                    style={{ width: `${timeLeft}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Cyber Battlefield Zone */}
            <div className="relative min-h-[250px] sm:min-h-[270px] my-2 rounded-3xl bg-slate-950/70 border border-cyan-500/30 overflow-hidden shadow-inner flex flex-col justify-between p-3.5 sm:p-4">
              {/* Incoming Missile Alert */}
              <div
                className="absolute left-1/2 -translate-x-1/2 transition-all duration-100 z-10 text-center"
                style={{ top: `${missileY}%` }}
              >
                <div className="text-3xl sm:text-4xl animate-bounce drop-shadow-[0_0_15px_#f43f5e]">
                  🚀💥
                </div>
                <div className="px-2 py-0.5 rounded-md bg-rose-950/90 border border-rose-500 text-[10px] text-rose-300 font-mono font-bold animate-pulse">
                  INCOMING WARHEAD
                </div>
              </div>

              {/* 4 Cyber Floating Target Drones */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 z-20 mt-1">
                {currentProblem.options.slice(0, 4).map((opt, idx) => {
                  const isLaserTarget = laserBeam && laserBeam.targetIdx === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleFireLaser(opt, idx)}
                      disabled={!!laserBeam}
                      className={`relative group w-full h-20 sm:h-24 rounded-2xl border-2 font-mono font-black text-base sm:text-lg flex flex-col items-center justify-center p-1.5 sm:p-2 transition-all duration-200 cursor-pointer shadow-lg active:scale-95 ${
                        isLaserTarget
                          ? laserBeam.isCorrect
                            ? 'bg-emerald-950 border-emerald-300 text-emerald-100 shadow-[0_0_30px_#10b981] scale-105 ring-4 ring-emerald-300'
                            : 'bg-rose-950 border-rose-400 text-rose-200 shadow-[0_0_30px_#f43f5e] scale-95'
                          : 'bg-slate-900/90 hover:bg-slate-850 border-cyan-500/40 hover:border-cyan-300 text-cyan-200 hover:shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                      }`}
                    >
                      <div className="text-[11px] text-cyan-400/80 mb-0.5 flex items-center gap-1 font-sans">
                        <Crosshair className="w-3 h-3 group-hover:animate-spin" />
                        <span>#{idx + 1}</span>
                      </div>
                      <span className="text-base sm:text-xl font-bold tracking-tight">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Laser Cannon Turret at Base */}
              <div className="relative z-20 flex justify-center items-center mt-auto">
                <div className="relative px-6 py-2 rounded-2xl bg-gradient-to-t from-cyan-950 to-slate-900 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping shadow-[0_0_10px_#06b6d4]" />
                  <span className="text-xs font-mono font-black text-cyan-300 tracking-wider">
                    ⚡ PHOTON CANNON ARMED
                  </span>
                </div>
              </div>
            </div>

            {/* Instruction */}
            <div className="text-center text-xs text-slate-400 font-medium">
              ⚡ เล็งคลิกโดรนตัวเลขคำตอบที่ถูกต้องเพื่อยิงเลเซอร์สกัดมิสไซล์ก่อนกระแทกฐาน!
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
              <Award className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">สิ้นสุดภารกิจดีเฟนส์!</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                คุณป้องกันฐานทัพและคำนวณจำนวนเต็มได้อย่างเฉียบคม
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/40 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">คะแนนภารกิจ:</span>
                <span className="text-cyan-400 font-bold text-lg">{score.toLocaleString()} แต้ม</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">คอมโบสูงสุด:</span>
                <span className="text-pink-400 font-bold">{maxCombo}x</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">คะแนนสูงสุดตลอดกาล:</span>
                <span className="text-yellow-400 font-bold">{highScore.toLocaleString()} แต้ม</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="flex-1 py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 transition flex items-center justify-center gap-2"
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
