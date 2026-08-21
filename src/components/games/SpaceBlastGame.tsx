import React, { useState, useEffect, useRef } from 'react';
import { Rocket, Shield, Zap, Sparkles, RefreshCw, Trophy, Heart, Award, ArrowLeft, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateIntegerProblem, GameMathProblem } from '../../utils/gameMathGenerator';
import { soundFx } from '../../services/sound';
import { getGameHighScore, saveGameHighScore } from '../../utils/gameHighScore';
import { GameRecord } from '../../types';

interface SpaceBlastGameProps {
  onBack: () => void;
  onSaveScore?: (score: number, details: string, resultData?: Partial<GameRecord>) => void;
}

export const SpaceBlastGame: React.FC<SpaceBlastGameProps> = ({ onBack, onSaveScore }) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getGameHighScore('space_blast'));
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [hp, setHp] = useState<number>(3);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const [currentProblem, setCurrentProblem] = useState<GameMathProblem | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [laserEffect, setLaserEffect] = useState<{ active: boolean; targetIdx: number | null }>({
    active: false,
    targetIdx: null,
  });
  const [explosion, setExplosion] = useState<{ active: boolean; text: string; isCorrect?: boolean }>({
    active: false,
    text: '',
    isCorrect: false,
  });
  const [greenFlash, setGreenFlash] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(100); // asteroid countdown bar (100 -> 0)
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const spawnNextProblem = () => {
    const prob = generateIntegerProblem('mixed', 'medium');
    setCurrentProblem(prob);
    setOptions(prob.options);
    setProgress(100);
  };

  const startGame = () => {
    soundFx.playPowerup();
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setHp(3);
    setCorrectCount(0);
    setTotalCount(0);
    startTimeRef.current = Date.now();
    setGreenFlash(false);
    setGameState('playing');
    spawnNextProblem();
  };

  // Asteroid timer countdown (10 seconds per question)
  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          // Time's up! Asteroid crashed
          handleAsteroidCrash();
          return 100;
        }
        return prev - 1; // 100 ticks * 100ms = exactly 10.0 seconds per asteroid
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, currentProblem]);

  const handleAsteroidCrash = () => {
    soundFx.playExplosion();
    setCombo(0);
    setExplosion({ active: true, text: '💥 ดาวเคราะห์ชนยาน!', isCorrect: false });
    setTimeout(() => setExplosion({ active: false, text: '', isCorrect: false }), 800);

    setHp((prevHp) => {
      const nextHp = prevHp - 1;
      if (nextHp <= 0) {
        endGame(score);
        return 0;
      }
      spawnNextProblem();
      return nextHp;
    });
  };

  const handleSelectOption = (chosen: number, idx: number) => {
    if (gameState !== 'playing' || !currentProblem) return;

    setLaserEffect({ active: true, targetIdx: idx });
    soundFx.playLaser();

    setTimeout(() => {
      setLaserEffect({ active: false, targetIdx: null });
      setTotalCount((t) => t + 1);

      if (chosen === currentProblem.answer) {
        // Correct hit with bright green flash effect!
        soundFx.playExplosion();
        setCorrectCount((c) => c + 1);
        const newCombo = combo + 1;
        setCombo(newCombo);
        if (newCombo > maxCombo) setMaxCombo(newCombo);
        soundFx.playCombo(newCombo);

        const earnedPoints = 100 + newCombo * 20;
        const newScore = score + earnedPoints;
        setScore(newScore);

        // Update High Score immediately if beaten
        if (newScore > highScore) {
          setHighScore(newScore);
          saveGameHighScore('space_blast', newScore);
        }

        // Green flash effect trigger
        setGreenFlash(true);
        setTimeout(() => setGreenFlash(false), 450);

        setExplosion({ active: true, text: `✨ ถูกต้อง! +${earnedPoints} แต้ม`, isCorrect: true });
        setTimeout(() => setExplosion({ active: false, text: '', isCorrect: false }), 600);

        spawnNextProblem();
      } else {
        // Wrong answer
        soundFx.playWrong();
        setCombo(0);
        setHp((prev) => {
          const nextHp = prev - 1;
          if (nextHp <= 0) {
            endGame(score, correctCount, totalCount + 1, hp - 1);
            return 0;
          }
          return nextHp;
        });
        setExplosion({ active: true, text: `❌ พลาด! คำตอบคือ ${currentProblem.answer}`, isCorrect: false });
        setTimeout(() => setExplosion({ active: false, text: '', isCorrect: false }), 1000);
      }
    }, 150);
  };

  const endGame = (
    finalScore: number,
    finalCorrect?: number,
    finalTotal?: number,
    finalHp?: number
  ) => {
    setGameState('gameover');
    soundFx.playFanfare();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    const newHigh = saveGameHighScore('space_blast', finalScore);
    setHighScore(newHigh);

    const c = finalCorrect ?? correctCount;
    const t = Math.max(1, finalTotal ?? totalCount);
    const acc = Math.round((c / t) * 100);
    const timeSpent = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    const hpLeft = Math.max(0, finalHp ?? hp);

    if (onSaveScore) {
      onSaveScore(
        finalScore,
        `ทำลายดาวเคราะห์ ${c} ลูก จากทั้งหมด ${t} ลูก (ความแม่นยำ ${acc}%, Combo สูงสุด x${maxCombo})`,
        {
          highScore: newHigh,
          correctCount: c,
          totalQuestions: t,
          accuracyPercentage: acc,
          maxCombo: maxCombo,
          timeSpentSeconds: timeSpent,
          details: `ทำลายดาวเคราะห์ ${c}/${t} ลูก, Combo x${maxCombo}, HP เหลือ ${hpLeft}`,
          specialMetrics: {
            asteroids_destroyed: c,
            hp_remaining: hpLeft,
            max_combo: maxCombo,
            seconds_survived: timeSpent,
          },
        }
      );
    }
  };

  return (
    <div className={`relative w-full max-w-3xl mx-auto bg-slate-950 text-white rounded-3xl border transition-all duration-300 shadow-2xl overflow-hidden min-h-[540px] flex flex-col select-none ${
      greenFlash ? 'border-emerald-400 shadow-emerald-500/50 ring-4 ring-emerald-400/50' : 'border-indigo-900/50'
    }`}>
      {/* Green Flash Screen Overlay */}
      {greenFlash && (
        <div className="absolute inset-0 bg-emerald-500/20 z-30 pointer-events-none animate-pulse" />
      )}

      {/* Background Starfield */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/70 via-slate-950 to-black pointer-events-none" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-indigo-900/40 bg-slate-900/60 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition text-slate-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับเมนูเกม</span>
        </button>

        <div className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm font-mono">
          <div className="flex items-center gap-1 text-rose-400">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  i < hp ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
                } transition-all`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-amber-300 font-bold">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{score.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-950/50 px-2.5 py-1 rounded-xl border border-yellow-500/30 text-[11px] sm:text-xs">
            <Crown className="w-3.5 h-3.5 text-yellow-400" />
            <span>สูงสุด: {highScore.toLocaleString()}</span>
          </div>

          {combo > 1 && (
            <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-[11px] animate-pulse">
              ⚡ {combo}x COMBO
            </div>
          )}
        </div>
      </div>

      {/* Main Game Screen */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-4 sm:p-6">
        {gameState === 'ready' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/20">
              <Rocket className="w-10 h-10 animate-bounce" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-indigo-300 via-cyan-200 to-white bg-clip-text text-transparent">
                ยานอวกาศฝ่าดงดาวเคราะห์
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                คำนวณผลคูณและผลหารจำนวนเต็มให้ไว ยิงเลเซอร์ทำลายดาวเคราะห์ก่อนที่มันจะตกลงมาชนยานอวกาศของคุณ!
              </p>
            </div>

            {/* High Score Banner on Ready */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-sm font-bold">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span>คะแนนสูงสุด: {highScore.toLocaleString()} แต้ม</span>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-base shadow-lg shadow-indigo-500/30 active:scale-95 transition"
            >
              🚀 เริ่มภารกิจอวกาศ (START)
            </button>
          </div>
        )}

        {gameState === 'playing' && currentProblem && (
          <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full py-2">
            {/* Asteroid Countdown Bar (10 Seconds) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                <span>ดาวเคราะห์พุ่งเข้ามา</span>
                <span className={`font-bold ${progress <= 30 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'}`}>
                  ⏳ {(progress / 10).toFixed(1)}s / 10s
                </span>
              </div>
              <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden border border-slate-700">
                <div
                  className={`h-full transition-all duration-100 ${
                    progress > 50 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : progress > 25 ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Target Asteroid Display */}
            <div className="relative text-center my-auto py-6">
              {explosion.active && (
                <div className={`absolute inset-0 flex items-center justify-center text-lg sm:text-xl font-black drop-shadow-md animate-ping pointer-events-none ${
                  explosion.isCorrect ? 'text-emerald-300' : 'text-rose-400'
                }`}>
                  {explosion.text}
                </div>
              )}

              <div className={`inline-block p-6 sm:p-8 rounded-3xl transition-all duration-200 backdrop-blur-md ${
                greenFlash
                  ? 'bg-emerald-950/90 border-2 border-emerald-400 shadow-2xl shadow-emerald-500 scale-105'
                  : 'bg-slate-900/90 border-2 border-indigo-500/50 shadow-xl shadow-indigo-950/60'
              }`}>
                <span className={`text-xs uppercase tracking-widest font-bold block mb-1 ${
                  greenFlash ? 'text-emerald-300' : 'text-indigo-400'
                }`}>
                  ดาวเคราะห์เป้าหมาย
                </span>
                <span className={`text-3xl sm:text-4xl font-mono font-black tracking-wider ${
                  greenFlash ? 'text-emerald-200' : 'text-white'
                }`}>
                  {currentProblem.expression} = ?
                </span>
              </div>
            </div>

            {/* Player Laser Ship & Option Turrets */}
            <div className="space-y-3">
              <div className="text-center text-slate-400 text-xs font-medium">
                เลือกเล็งปืนเลเซอร์ไปยังเป้าหมายคำตอบที่ถูกต้อง:
              </div>

              <div className="grid grid-cols-2 gap-3">
                {options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(opt, idx)}
                    className={`relative py-4 px-3 rounded-2xl border font-mono font-black text-xl sm:text-2xl transition active:scale-95 shadow-md flex items-center justify-center gap-2 ${
                      laserEffect.active && laserEffect.targetIdx === idx
                        ? 'bg-indigo-500 text-white border-white scale-105 shadow-indigo-500/80'
                        : 'bg-slate-900/80 hover:bg-slate-800 border-indigo-800/60 hover:border-indigo-400 text-indigo-200'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-cyan-400 opacity-70" />
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <Award className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">สิ้นสุดภารกิจ!</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                ยานอวกาศเสียหาย แต่คุณปกป้องฐานทัพได้อย่างกล้าหาญ
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-900/50 space-y-2 font-mono">
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
                <span className="text-slate-400">Combo สูงสุด:</span>
                <span className="text-indigo-300 font-bold">{maxCombo} ต่อเนื่อง</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
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

