import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Flame, RefreshCw, Award, Sparkles, Zap, Shield, Wand2, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateIntegerProblem, GameMathProblem } from '../../utils/gameMathGenerator';
import { soundFx } from '../../services/sound';
import { getGameHighScore, saveGameHighScore } from '../../utils/gameHighScore';
import { GameRecord } from '../../types';

interface MagicPotionAlchemyGameProps {
  onBack: () => void;
  onSaveScore?: (score: number, details: string, resultData?: Partial<GameRecord>) => void;
}

export const MagicPotionAlchemyGame: React.FC<MagicPotionAlchemyGameProps> = ({ onBack, onSaveScore }) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getGameHighScore('alchemy_potion'));
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const totalRounds = 10;
  const [timeLeft, setTimeLeft] = useState<number>(100); // 10s
  const [currentProblem, setCurrentProblem] = useState<GameMathProblem | null>(null);
  const [alchemyBrewEffect, setAlchemyBrewEffect] = useState<{ active: boolean; idx: number; correct: boolean } | null>(null);
  const [cauldronColor, setCauldronColor] = useState<string>('purple');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const spawnProblem = (r: number) => {
    if (r > totalRounds) {
      endGame(score);
      return;
    }
    const prob = generateIntegerProblem('mixed', r > 5 ? 'hard' : 'medium');
    setCurrentProblem(prob);
    setTimeLeft(100);
    setAlchemyBrewEffect(null);
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
          handleCauldronExplode();
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

  const handleCauldronExplode = () => {
    soundFx.playExplosion();
    setCombo(0);
    setAlchemyBrewEffect({ active: true, idx: -1, correct: false });

    setTimeout(() => {
      setRound((r) => {
        const nextR = r + 1;
        spawnProblem(nextR);
        return nextR;
      });
    }, 600);
  };

  const handleBrewPotion = (val: number, idx: number) => {
    if (gameState !== 'playing' || alchemyBrewEffect || !currentProblem) return;

    const isCorrect = val === currentProblem.answer;

    setAlchemyBrewEffect({
      active: true,
      idx,
      correct: isCorrect,
    });

    if (isCorrect) {
      soundFx.playMagic();
      soundFx.playCorrect();
      setCauldronColor('emerald');

      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);

      const timeBonus = Math.round(timeLeft * 0.85);
      const comboBonus = nextCombo * 25;
      const pts = 120 + timeBonus + comboBonus;
      const newScore = score + pts;
      setScore(newScore);

      // Magical Potion Sparkle Confetti
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { x: 0.5, y: 0.65 },
        colors: ['#A855F7', '#EC4899', '#38BDF8', '#F472B6', '#FBBF24'],
      });

      if (newScore > highScore) {
        setHighScore(newScore);
        saveGameHighScore('alchemy_potion', newScore);
      }

      setTimeout(() => {
        setAlchemyBrewEffect(null);
        setCauldronColor('purple');
        setRound((r) => {
          const nextR = r + 1;
          spawnProblem(nextR);
          return nextR;
        });
      }, 700);
    } else {
      soundFx.playWrong();
      setCauldronColor('rose');
      setCombo(0);
      setTimeout(() => {
        setAlchemyBrewEffect(null);
        setCauldronColor('purple');
      }, 500);
    }
  };

  const endGame = (finalScore: number) => {
    setGameState('gameover');
    soundFx.playFanfare();

    const newHigh = saveGameHighScore('alchemy_potion', finalScore);
    setHighScore(newHigh);

    if (onSaveScore) {
      onSaveScore(finalScore, `ปรุงยาเวทมนตร์แปรธาตุ: ได้คะแนน ${finalScore} แต้ม`, {
        highScore: newHigh,
        maxCombo,
      });
    }
  };

  return (
    <div
      className={`relative w-full max-w-3xl mx-auto bg-slate-950 text-white rounded-3xl border-2 transition-all duration-300 shadow-2xl overflow-hidden min-h-[580px] flex flex-col select-none ${
        alchemyBrewEffect?.correct
          ? 'border-fuchsia-400 ring-8 ring-fuchsia-500/90 shadow-[0_0_55px_#d946ef]'
          : alchemyBrewEffect && !alchemyBrewEffect.correct
          ? 'border-rose-500 ring-8 ring-rose-500/80 shadow-[0_0_50px_#f43f5e]'
          : 'border-fuchsia-500/40 shadow-fuchsia-950/50'
      }`}
    >
      {/* Mystic Lab Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(217,70,239,0.2),transparent_70%)] pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-fuchsia-500/20 bg-slate-950/80 backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-slate-500"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับฮับเกม</span>
        </button>

        <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-mono">
          <div className="flex items-center gap-1 text-fuchsia-400 font-bold">
            <span>🧪 ขวดยาที่ {round} / {totalRounds}</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-300 font-bold">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>{score.toLocaleString()}</span>
          </div>

          {combo > 1 && (
            <div className="flex items-center gap-1 text-pink-300 font-extrabold animate-bounce">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>{combo}x ร่ายมนตร์</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-4 sm:p-6">
        {gameState === 'ready' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-fuchsia-500/20 border-2 border-fuchsia-400 flex items-center justify-center text-4xl shadow-[0_0_35px_rgba(217,70,239,0.6)] animate-pulse">
              🧪
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-fuchsia-500/20 border border-fuchsia-400 text-fuchsia-300 text-xs font-bold uppercase tracking-widest">
                Alchemy Lab • เกมที่ 14
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                ปรุงยาเวทมนตร์แปรธาตุ (Magic Alchemy)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                คิดค้นสูตรยาวิเศษในหม้อปรุงยาแปรธาตุ! หยดสารเคมีตัวเลขที่คำนวณถูกต้องลงหม้อต้มวิเศษเพื่อร่ายคาถาให้สำเร็จภายใน 10 วินาที!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-fuchsia-500/30 text-xs text-slate-300 space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <span className="text-fuchsia-400 font-bold">🧪 หม้อปรุงยา:</span> แสงเวทมนตร์เปล่งประกายสีรุ้ง
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-300 font-bold">⏱️ กฎเวลา:</span> 10 สูตรยา ข้อละ 10 วินาที ปรุงทันได้รับโบนัสแปรธาตุ
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-black text-base shadow-[0_0_35px_rgba(217,70,239,0.7)] active:scale-95 transition"
            >
              🧪 เริ่มปรุงสูตรยาวิเศษ (START BREWING)
            </button>
          </div>
        )}

        {gameState === 'playing' && currentProblem && (
          <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full py-1">
            {/* HUD Target */}
            <div className="space-y-2 text-center">
              <div className="inline-block px-5 py-2.5 rounded-2xl bg-slate-900/90 border border-fuchsia-500/50 shadow-[0_0_25px_rgba(217,70,239,0.35)] backdrop-blur-md">
                <span className="text-[11px] uppercase tracking-widest text-fuchsia-400 font-bold block mb-0.5">
                  สูตรยาเวทมนตร์ {round} / {totalRounds}
                </span>
                <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wider">
                  {currentProblem.expression} = ?
                </span>
              </div>

              {/* 10s Potion Heat Bar */}
              <div className="space-y-1 max-w-xs mx-auto">
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span className="text-fuchsia-300 font-bold">อุณหภูมิหม้อต้ม</span>
                  <span className={`font-bold ${timeLeft <= 30 ? 'text-rose-400 animate-pulse' : 'text-fuchsia-300'}`}>
                    ⏳ {(timeLeft / 10).toFixed(1)}s / 10s
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700">
                  <div
                    className={`h-full transition-all duration-100 ${
                      timeLeft > 50
                        ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500'
                        : timeLeft > 25
                        ? 'bg-gradient-to-r from-amber-400 to-pink-500'
                        : 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse'
                    }`}
                    style={{ width: `${timeLeft}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Cauldron & 4 Potion Flasks */}
            <div className="relative min-h-[250px] sm:min-h-[270px] my-2 rounded-3xl bg-slate-950/85 border border-fuchsia-500/30 overflow-hidden shadow-inner flex flex-col justify-between p-3.5 sm:p-4">
              {/* 4 Magic Potion Flask Buttons */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 z-20">
                {currentProblem.options.slice(0, 4).map((opt, idx) => {
                  const isBrewTarget = alchemyBrewEffect && alchemyBrewEffect.idx === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleBrewPotion(opt, idx)}
                      disabled={!!alchemyBrewEffect}
                      className={`relative h-20 sm:h-22 rounded-2xl border-2 font-mono font-black text-base sm:text-lg flex flex-col items-center justify-center p-1.5 sm:p-2 transition-all duration-200 cursor-pointer shadow-lg active:scale-95 ${
                        isBrewTarget
                          ? alchemyBrewEffect.correct
                            ? 'bg-gradient-to-b from-fuchsia-500 to-purple-800 border-white text-white shadow-[0_0_35px_#d946ef] scale-105 ring-4 ring-fuchsia-300'
                            : 'bg-rose-950 border-rose-400 text-rose-200 shadow-[0_0_30px_#f43f5e] scale-95'
                          : 'bg-slate-900/90 hover:bg-slate-850 border-fuchsia-500/40 hover:border-fuchsia-300 text-fuchsia-200 hover:shadow-[0_0_20px_rgba(217,70,239,0.6)]'
                      }`}
                    >
                      <div className="text-xs sm:text-sm mb-0.5 font-sans">🧪 ขวดที่ {idx + 1}</div>
                      <span className="text-base sm:text-xl font-bold">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Glowing Magic Cauldron at Center */}
              <div className="relative z-10 flex flex-col items-center justify-center my-2">
                <div
                  className={`w-24 h-14 sm:w-28 sm:h-16 rounded-b-full border-4 flex items-center justify-center shadow-2xl transition-all duration-300 ${
                    cauldronColor === 'emerald'
                      ? 'bg-emerald-900/90 border-emerald-300 shadow-[0_0_35px_#10b981]'
                      : cauldronColor === 'rose'
                      ? 'bg-rose-950/90 border-rose-400 shadow-[0_0_35px_#f43f5e]'
                      : 'bg-gradient-to-b from-purple-900 to-slate-900 border-fuchsia-400 shadow-[0_0_30px_rgba(217,70,239,0.5)]'
                  }`}
                >
                  <div className="text-2xl sm:text-3xl animate-bounce">
                    {cauldronColor === 'emerald' ? '✨🫕' : '🫕'}
                  </div>
                </div>
                <span className="text-[10px] text-fuchsia-400 font-mono font-bold mt-1">
                  ✨ CAULDRON BUBBLING
                </span>
              </div>

              <div className="text-center text-[11px] text-fuchsia-300 font-mono">
                ✨ เลือกขวดยาสารสกัดตัวเลขที่ถูกต้องหยดลงหม้อปรุงยา!
              </div>
            </div>

            <div className="text-center text-xs text-slate-400 font-medium">
              🪄 ร่ายมนตร์แปรธาตุอย่างรวดเร็วและแม่นยำภายใน 10 วินาที!
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-fuchsia-500/20 border-2 border-fuchsia-400 flex items-center justify-center text-fuchsia-400 shadow-[0_0_35px_rgba(217,70,239,0.5)]">
              <Award className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">ปรุงยาวิเศษสำเร็จ!</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                คุณเชี่ยวชาญศาสตร์แปรธาตุและคำนวณจำนวนเต็มได้อย่างยอดเยี่ยม
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-fuchsia-500/40 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">คะแนนพลังเวทมนตร์:</span>
                <span className="text-fuchsia-400 font-bold text-lg">{score.toLocaleString()} แต้ม</span>
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
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-black text-sm shadow-lg shadow-fuchsia-500/30 transition flex items-center justify-center gap-2"
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
