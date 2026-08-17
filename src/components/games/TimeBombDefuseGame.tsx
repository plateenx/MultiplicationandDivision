import React, { useState, useEffect, useRef } from 'react';
import { Bomb, Scissors, Timer, Trophy, RefreshCw, ArrowLeft, Award, ShieldAlert, Sparkles, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateIntegerProblem, getRandomInt, formatInteger } from '../../utils/gameMathGenerator';
import { soundFx } from '../../services/sound';
import { getGameHighScore, saveGameHighScore } from '../../utils/gameHighScore';

interface TimeBombDefuseGameProps {
  onBack: () => void;
  onSaveScore?: (score: number, details: string) => void;
}

interface Wire {
  colorName: string;
  colorClass: string;
  borderClass: string;
  bgGlow: string;
  expression: string;
  value: number;
  isCut: boolean;
}

export const TimeBombDefuseGame: React.FC<TimeBombDefuseGameProps> = ({ onBack, onSaveScore }) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getGameHighScore('bomb_defuse'));
  const [defusedCount, setDefusedCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [targetClue, setTargetClue] = useState<string>('');
  const [targetValue, setTargetValue] = useState<number>(0);
  const [wires, setWires] = useState<Wire[]>([]);
  const [bombFlash, setBombFlash] = useState<boolean>(false);
  const [defuseSuccess, setDefuseSuccess] = useState<boolean>(false);
  const [explosionFlashing, setExplosionFlashing] = useState<boolean>(false);
  const [flashTick, setFlashTick] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const spawnBomb = () => {
    // Generate 4 wires with different integer expressions
    const wireColors = [
      { name: 'สายสีแดง', class: 'bg-rose-500 hover:bg-rose-400', border: 'border-rose-400', glow: 'shadow-rose-500/50' },
      { name: 'สายสีน้ำเงิน', class: 'bg-blue-500 hover:bg-blue-400', border: 'border-blue-400', glow: 'shadow-blue-500/50' },
      { name: 'สายสีเหลือง', class: 'bg-amber-400 hover:bg-amber-300 text-black', border: 'border-amber-300', glow: 'shadow-amber-400/50' },
      { name: 'สายสีเขียว', class: 'bg-emerald-500 hover:bg-emerald-400', border: 'border-emerald-400', glow: 'shadow-emerald-500/50' },
    ];

    const generatedWires: Wire[] = [];
    const usedValues = new Set<number>();

    for (let i = 0; i < 4; i++) {
      let prob = generateIntegerProblem('mixed', 'medium');
      let safety = 0;
      while (usedValues.has(prob.answer) && safety < 20) {
        prob = generateIntegerProblem('mixed', 'medium');
        safety++;
      }
      usedValues.add(prob.answer);

      generatedWires.push({
        colorName: wireColors[i].name,
        colorClass: wireColors[i].class,
        borderClass: wireColors[i].border,
        bgGlow: wireColors[i].glow,
        expression: prob.expression,
        value: prob.answer,
        isCut: false,
      });
    }

    // Pick 1 wire as target
    const targetIdx = Math.floor(Math.random() * 4);
    const chosenWire = generatedWires[targetIdx];

    setTargetValue(chosenWire.value);
    setTargetClue(`ตัดสายที่มีผลลัพธ์เท่ากับ ${chosenWire.value}`);
    setWires(generatedWires);
  };

  const startGame = () => {
    soundFx.playPowerup();
    setScore(0);
    setDefusedCount(0);
    setTimeLeft(25);
    setExplosionFlashing(false);
    setGameState('playing');
    spawnBomb();
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          triggerExplosionFail('หมดเวลา!');
          return 0;
        }
        if (t <= 5) {
          soundFx.playCountdown();
          setBombFlash((f) => !f);
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, defusedCount, score]);

  const triggerExplosionFail = (reason: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    soundFx.playExplosion();
    setExplosionFlashing(true);
    setFlashTick(6);

    const fInterval = setInterval(() => {
      setFlashTick((prev) => {
        if (prev <= 1) {
          clearInterval(fInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 150);

    setTimeout(() => {
      setExplosionFlashing(false);
      endGame(score, reason);
    }, 1100);
  };

  const handleCutWire = (index: number) => {
    if (gameState !== 'playing' || wires[index].isCut) return;

    const clickedWire = wires[index];
    soundFx.playLaser();

    const updatedWires = [...wires];
    updatedWires[index].isCut = true;
    setWires(updatedWires);

    if (clickedWire.value === targetValue) {
      // Correct Wire Cut!
      soundFx.playCorrect();
      soundFx.playCombo(defusedCount + 1);
      const nextDefused = defusedCount + 1;
      setDefusedCount(nextDefused);
      const points = 150 + timeLeft * 10;
      const newScore = score + points;
      setScore(newScore);

      if (newScore > highScore) {
        setHighScore(newScore);
        saveGameHighScore('bomb_defuse', newScore);
      }

      setTimeLeft((t) => Math.min(t + 6, 30)); // Add 6s bonus

      setDefuseSuccess(true);
      setTimeout(() => {
        setDefuseSuccess(false);
        spawnBomb();
      }, 500);
    } else {
      // Wrong wire cut! Boom explosion!
      triggerExplosionFail(`ตัดสายผิด! คำตอบคือ ${targetValue}`);
    }
  };

  const endGame = (finalScore: number, reason: string) => {
    setGameState('gameover');
    soundFx.playExplosion();
    soundFx.playFanfare();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    const newHigh = saveGameHighScore('bomb_defuse', finalScore);
    setHighScore(newHigh);

    if (onSaveScore) {
      onSaveScore(finalScore, `ปลดชนวนระเบิดเวลา: ${finalScore} แต้ม (กู้ระเบิดได้ ${defusedCount} ลูก - ${reason})`);
    }
  };

  return (
    <div className={`relative w-full max-w-3xl mx-auto bg-slate-950 text-white rounded-3xl border transition-all duration-150 shadow-2xl overflow-hidden min-h-[540px] flex flex-col select-none ${
      explosionFlashing
        ? flashTick % 2 === 0
          ? 'border-rose-500 bg-red-950 shadow-2xl shadow-rose-600 ring-8 ring-rose-500'
          : 'border-yellow-400 bg-amber-950 shadow-2xl shadow-yellow-500 ring-8 ring-yellow-400'
        : 'border-rose-900/40'
    }`}>
      {/* Flashing Explosion Screen Overlay */}
      {explosionFlashing && (
        <div className={`absolute inset-0 z-40 flex items-center justify-center pointer-events-none transition-all ${
          flashTick % 2 === 0 ? 'bg-red-600/60' : 'bg-yellow-500/60'
        }`}>
          <div className="text-center p-6 bg-black/90 rounded-3xl border-4 border-rose-500 animate-ping">
            <span className="text-4xl sm:text-6xl font-black text-yellow-300 block mb-2">💥 ตู้มมม! 💥</span>
            <span className="text-lg sm:text-2xl font-black text-white">กู้ระเบิดไม่สำเร็จ!</span>
          </div>
        </div>
      )}

      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-950/40 via-slate-950 to-black pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-rose-900/40 bg-slate-900/60 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition text-slate-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับเมนูเกม</span>
        </button>

        <div className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm font-mono">
          <div className="flex items-center gap-1.5 font-bold">
            <Timer className={`w-4 h-4 ${timeLeft <= 5 ? 'animate-ping text-rose-500' : 'text-amber-400'}`} />
            <span className={timeLeft <= 5 ? 'text-rose-400 font-black' : 'text-amber-300'}>{timeLeft}s</span>
          </div>

          <div className="flex items-center gap-1.5 text-yellow-300 font-bold">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>{score.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-950/50 px-2.5 py-1 rounded-xl border border-yellow-500/30 text-[11px] sm:text-xs">
            <Crown className="w-3.5 h-3.5 text-yellow-400" />
            <span>สูงสุด: {highScore.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1 text-emerald-400 font-bold">
            <Bomb className="w-4 h-4" />
            <span>กู้ได้ {defusedCount} ลูก</span>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-4 sm:p-6">
        {gameState === 'ready' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/20">
              <Bomb className="w-10 h-10 animate-bounce" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-rose-300 via-orange-200 to-white bg-clip-text text-transparent">
                ปลดชนวนระเบิดเวลา (Math Defuse)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                อ่านคำใบ้สมการการคูณและการหารจำนวนเต็ม แล้วใช้กรรไกรตัดสายชนวนที่ถูกต้องเพื่อปลดชนวนก่อนที่เวลานับถอยหลังจะหมด!
              </p>
            </div>

            {/* High Score Banner on Ready */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-sm font-bold">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span>คะแนนสูงสุด: {highScore.toLocaleString()} แต้ม</span>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-extrabold text-base shadow-lg shadow-rose-500/30 active:scale-95 transition"
            >
              💣 เริ่มภารกิจกู้ระเบิด (START)
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full py-2">
            {/* Clue Prompt */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-950/80 border border-rose-500/50 shadow-lg shadow-rose-950/50 animate-pulse">
                <Scissors className="w-4 h-4 text-rose-400" />
                <span className="text-sm sm:text-base font-black text-rose-200">
                  {targetClue}
                </span>
              </div>
            </div>

            {/* Bomb Display */}
            <div className="relative text-center my-auto py-4">
              <div
                className={`inline-block p-6 sm:p-8 rounded-3xl border-2 transition-all ${
                  bombFlash
                    ? 'bg-rose-900 border-rose-400 scale-105 shadow-2xl shadow-rose-600'
                    : defuseSuccess
                    ? 'bg-emerald-950 border-emerald-400 scale-105'
                    : 'bg-slate-900/90 border-slate-700 shadow-xl'
                }`}
              >
                <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">
                  เวลานับถอยหลัง
                </div>
                <div className="text-4xl sm:text-5xl font-mono font-black text-rose-500 tracking-wider">
                  00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                </div>
              </div>
            </div>

            {/* Wires to Cut */}
            <div className="space-y-2.5">
              <div className="text-xs text-slate-400 text-center font-medium">
                เลือกตัดสายชนวนที่มีผลลัพธ์ตรงกับคำใบ้:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {wires.map((wire, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCutWire(idx)}
                    disabled={wire.isCut}
                    className={`relative p-3.5 rounded-2xl border-2 text-left font-mono transition-all active:scale-95 flex items-center justify-between shadow-md ${
                      wire.isCut
                        ? 'opacity-30 bg-slate-900 border-slate-800 line-through'
                        : `${wire.colorClass} ${wire.borderClass} ${wire.bgGlow} text-white font-bold`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Scissors className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-sans">{wire.colorName}:</span>
                    </div>
                    <span className="text-base sm:text-lg font-black tracking-wider">
                      {wire.expression}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/20">
              <Award className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">สิ้นสุดภารกิจ!</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                การปลดชนวนระเบิดต้องอาศัยทั้งสมาธิและความแม่นยำ
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-900/50 space-y-2 font-mono">
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
                <span className="text-slate-400">จำนวนระเบิดที่กู้สำเร็จ:</span>
                <span className="text-emerald-300 font-bold">{defusedCount} ลูก</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="flex-1 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
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

