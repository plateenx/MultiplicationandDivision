import React, { useState, useEffect, useRef } from 'react';
import { Flame, Trophy, RefreshCw, ArrowLeft, Award, ArrowRight, ChevronLeft, ChevronRight, Gauge, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateIntegerProblem, GameMathProblem } from '../../utils/gameMathGenerator';
import { soundFx } from '../../services/sound';
import { getGameHighScore, saveGameHighScore } from '../../utils/gameHighScore';
import { GameRecord } from '../../types';

interface FormulaDriftGameProps {
  onBack: () => void;
  onSaveScore?: (score: number, details: string, resultData?: Partial<GameRecord>) => void;
}

export const FormulaDriftGame: React.FC<FormulaDriftGameProps> = ({ onBack, onSaveScore }) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [carLane, setCarLane] = useState<number>(1); // 0 = Left, 1 = Middle, 2 = Right
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getGameHighScore('formula_drift'));
  const [speedKmh, setSpeedKmh] = useState<number>(120);
  const [maxSpeed, setMaxSpeed] = useState<number>(120);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const [lives, setLives] = useState<number>(3);
  const [currentProblem, setCurrentProblem] = useState<GameMathProblem | null>(null);
  const [laneValues, setLaneValues] = useState<{ val: number; isCorrect: boolean }[]>([]);
  const [yPos, setYPos] = useState<number>(0); // 0 (far) to 100% (at car)
  const [crashFeedback, setCrashFeedback] = useState<string | null>(null);

  const loopRef = useRef<NodeJS.Timeout | null>(null);

  const spawnSignpost = () => {
    const prob = generateIntegerProblem('mixed', 'medium');
    setCurrentProblem(prob);

    // Pick 3 options for the 3 lanes
    const correctVal = prob.answer;
    const distractors = prob.options.filter((o) => o !== correctVal).slice(0, 2);
    const lanes = [correctVal, ...distractors].sort(() => Math.random() - 0.5);

    setLaneValues(
      lanes.map((val) => ({
        val,
        isCorrect: val === correctVal,
      }))
    );
    setYPos(0);
  };

  const startGame = () => {
    soundFx.playPowerup();
    setScore(0);
    setSpeedKmh(120);
    setMaxSpeed(120);
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setTotalCount(0);
    startTimeRef.current = Date.now();
    setLives(3);
    setCarLane(1);
    setGameState('playing');
    spawnSignpost();
  };

  // Keyboard navigation (Arrow keys / A D)
  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setCarLane((l) => Math.max(0, l - 1));
        soundFx.playClick();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setCarLane((l) => Math.min(2, l + 1));
        soundFx.playClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Road animation loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    loopRef.current = setInterval(() => {
      setYPos((prev) => {
        if (prev >= 90) {
          // Check collision with car lane
          checkCollision();
          return 0;
        }
        return prev + 3.5 + speedKmh * 0.01;
      });
    }, 50);

    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
    };
  }, [gameState, carLane, laneValues, speedKmh]);

  const checkCollision = () => {
    if (!laneValues[carLane]) return;

    setTotalCount((t) => t + 1);
    const chosen = laneValues[carLane];
    if (chosen.isCorrect) {
      // Hit correct checkpoint!
      soundFx.playCorrect();
      setCorrectCount((c) => c + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      soundFx.playCombo(newStreak);

      const pts = 120 + newStreak * 25;
      const newScore = score + pts;
      setScore(newScore);

      if (newScore > highScore) {
        setHighScore(newScore);
        saveGameHighScore('formula_drift', newScore);
      }

      setSpeedKmh((sp) => {
        const nextSp = Math.min(sp + 8, 280);
        if (nextSp > maxSpeed) setMaxSpeed(nextSp);
        return nextSp;
      });
      spawnSignpost();
    } else {
      // Crash into wrong sign!
      soundFx.playExplosion();
      setStreak(0);
      setSpeedKmh(120);
      setCrashFeedback(`💥 ชนป้ายผิด! คำตอบคือ ${currentProblem?.answer}`);
      setTimeout(() => setCrashFeedback(null), 800);

      setLives((l) => {
        const nextL = l - 1;
        if (nextL <= 0) {
          endGame(score, correctCount, totalCount + 1, maxSpeed, maxStreak);
          return 0;
        }
        spawnSignpost();
        return nextL;
      });
    }
  };

  const endGame = (
    finalScore?: number,
    finalCorrect?: number,
    finalTotal?: number,
    finalMaxSpeed?: number,
    finalMaxStreak?: number
  ) => {
    setGameState('gameover');
    soundFx.playFanfare();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    const s = finalScore ?? score;
    const newHigh = saveGameHighScore('formula_drift', s);
    setHighScore(newHigh);

    const c = finalCorrect ?? correctCount;
    const t = Math.max(1, finalTotal ?? totalCount);
    const acc = Math.round((c / t) * 100);
    const topSpeed = finalMaxSpeed ?? maxSpeed;
    const topStreak = finalMaxStreak ?? maxStreak;
    const timeSpent = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

    if (onSaveScore) {
      onSaveScore(
        s,
        `ซิ่งรถดริฟต์คำนวณ: ${s} แต้ม (ความเร็วสูงสุด ${topSpeed} km/h, ผ่านด่าน ${c}/${t} ป้าย)`,
        {
          highScore: newHigh,
          correctCount: c,
          totalQuestions: t,
          accuracyPercentage: acc,
          maxCombo: topStreak,
          timeSpentSeconds: timeSpent,
          details: `ความเร็วสูงสุด ${topSpeed} km/h, ผ่านด่าน ${c}/${t} ป้าย (ความแม่นยำ ${acc}%), Combo x${topStreak}`,
          specialMetrics: {
            max_speed_kmh: topSpeed,
            gates_passed: c,
            gates_total: t,
            max_streak: topStreak,
            seconds_raced: timeSpent,
          },
        }
      );
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto bg-slate-950 text-white rounded-3xl border border-cyan-500/30 shadow-2xl overflow-hidden min-h-[540px] flex flex-col select-none">
      {/* Background Track */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/40 via-slate-950 to-black pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-cyan-900/40 bg-slate-900/60 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition text-slate-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับเมนูเกม</span>
        </button>

        <div className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm font-mono">
          <div className="flex items-center gap-1 text-cyan-400 font-bold">
            <Gauge className="w-4 h-4" />
            <span>{speedKmh} km/h</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-300 font-bold">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>{score.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-950/50 px-2.5 py-1 rounded-xl border border-yellow-500/30 text-[11px] sm:text-xs">
            <Crown className="w-3.5 h-3.5 text-yellow-400" />
            <span>สูงสุด: {highScore.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1 text-rose-400">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`text-base ${i < lives ? 'opacity-100' : 'opacity-20'}`}>
                ❤️
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-4 sm:p-6">
        {gameState === 'ready' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-4xl shadow-lg shadow-cyan-500/20">
              🏎️
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-cyan-300 via-blue-200 to-white bg-clip-text text-transparent">
                ซิ่งรถดริฟต์คำนวณ (Math Drift)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                ขับรถแข่งด้วยความเร็วสูง เปลี่ยนเลนซ้าย-กลาง-ขวา ไปชนป้ายคำตอบที่ถูกต้องของการคูณ/หารจำนวนเต็ม หลบป้ายหลอกเพื่อเพิ่มเทอร์โบ!
              </p>
            </div>

            {/* High Score Banner on Ready */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-sm font-bold">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span>คะแนนสูงสุด: {highScore.toLocaleString()} แต้ม</span>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-base shadow-lg shadow-cyan-500/30 active:scale-95 transition"
            >
              🏎️ ออกสตาร์ท (START)
            </button>
          </div>
        )}

        {gameState === 'playing' && currentProblem && (
          <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full py-1">
            {/* Dashboard Math HUD */}
            <div className="text-center">
              <div className="inline-block px-5 py-3 rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-xl backdrop-blur-md">
                <span className="text-[11px] uppercase tracking-widest text-cyan-400 font-bold block mb-0.5">
                  เป้าหมายเลนถนน
                </span>
                <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wider">
                  {currentProblem.expression} = ?
                </span>
              </div>
            </div>

            {/* 3-Lane Highway View */}
            <div className="relative h-64 sm:h-72 bg-slate-900/80 rounded-3xl border-2 border-slate-700 my-auto overflow-hidden shadow-2xl flex flex-col justify-between">
              {crashFeedback && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs">
                  <span className="px-4 py-2 rounded-2xl bg-rose-600 text-white text-sm font-black animate-bounce">
                    {crashFeedback}
                  </span>
                </div>
              )}

              {/* Highway Lane Divider Lines */}
              <div className="absolute inset-0 grid grid-cols-3 divide-x divide-dashed divide-slate-700/80 pointer-events-none" />

              {/* Approaching Signposts */}
              <div
                className="absolute left-0 right-0 grid grid-cols-3 px-2 z-10 transition-all duration-75"
                style={{ top: `${yPos}%` }}
              >
                {laneValues.map((lane, idx) => (
                  <div key={idx} className="flex justify-center">
                    <div className="px-3 py-1.5 rounded-xl bg-gradient-to-tr from-indigo-900 to-cyan-900 border border-cyan-400 font-mono font-black text-base sm:text-lg text-white shadow-lg shadow-cyan-950/80">
                      {lane.val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Player Race Car (Bottom of screen) */}
              <div className="absolute bottom-4 left-0 right-0 grid grid-cols-3 px-2 z-20">
                <div
                  className="flex justify-center transition-transform duration-150"
                  style={{
                    gridColumnStart: carLane + 1,
                  }}
                >
                  <div className="text-4xl sm:text-5xl animate-bounce">
                    🏎️
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile / Screen Lane Controls */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => {
                  setCarLane(0);
                  soundFx.playClick();
                }}
                className={`py-3.5 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-1 ${
                  carLane === 0
                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/40 font-black'
                    : 'bg-slate-900 border border-slate-700 text-slate-300'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>เลนซ้าย</span>
              </button>

              <button
                onClick={() => {
                  setCarLane(1);
                  soundFx.playClick();
                }}
                className={`py-3.5 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-1 ${
                  carLane === 1
                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/40 font-black'
                    : 'bg-slate-900 border border-slate-700 text-slate-300'
                }`}
              >
                <span>เลนกลาง</span>
              </button>

              <button
                onClick={() => {
                  setCarLane(2);
                  soundFx.playClick();
                }}
                className={`py-3.5 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-1 ${
                  carLane === 2
                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/40 font-black'
                    : 'bg-slate-900 border border-slate-700 text-slate-300'
                }`}
              >
                <span>เลนขวา</span>
                <ChevronRight className="w-4 h-4" />
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
              <h2 className="text-2xl sm:text-3xl font-black text-white">สิ้นสุดการแข่งขัน!</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                รถแข่งเข้าสู่จุดตรวจด้วยความเร็วสุดเร้าใจ
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-900/50 space-y-2 font-mono">
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
                <span className="text-slate-400">ความเร็วสูงสุด:</span>
                <span className="text-cyan-300 font-bold">{speedKmh} km/h</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="flex-1 py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>แข่งใหม่อีกครั้ง</span>
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

