import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Flame, RefreshCw, Award, Sparkles, Zap, Shield, Waves, Anchor } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateIntegerProblem, GameMathProblem } from '../../utils/gameMathGenerator';
import { soundFx } from '../../services/sound';
import { getGameHighScore, saveGameHighScore } from '../../utils/gameHighScore';
import { GameRecord } from '../../types';

interface DeepSeaTreasureGameProps {
  onBack: () => void;
  onSaveScore?: (score: number, details: string, resultData?: Partial<GameRecord>) => void;
}

export const DeepSeaTreasureGame: React.FC<DeepSeaTreasureGameProps> = ({ onBack, onSaveScore }) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getGameHighScore('deep_sea_treasure'));
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const totalRounds = 10;
  const [oxygen, setOxygen] = useState<number>(100); // 10s countdown
  const [currentProblem, setCurrentProblem] = useState<GameMathProblem | null>(null);
  const [chestOpenEffect, setChestOpenEffect] = useState<{ active: boolean; idx: number; correct: boolean } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const spawnProblem = (r: number) => {
    if (r > totalRounds) {
      endGame(score);
      return;
    }
    const prob = generateIntegerProblem('mixed', r > 5 ? 'hard' : 'medium');
    setCurrentProblem(prob);
    setOxygen(100);
    setChestOpenEffect(null);
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

  // 10s Oxygen timer per question
  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setOxygen((prev) => {
        if (prev <= 1) {
          handleOxygenDepleted();
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

  const handleOxygenDepleted = () => {
    soundFx.playWrong();
    setCombo(0);
    setChestOpenEffect({ active: true, idx: -1, correct: false });

    setTimeout(() => {
      setRound((r) => {
        const nextR = r + 1;
        spawnProblem(nextR);
        return nextR;
      });
    }, 600);
  };

  const handleOpenChest = (val: number, idx: number) => {
    if (gameState !== 'playing' || chestOpenEffect || !currentProblem) return;

    const isCorrect = val === currentProblem.answer;

    setChestOpenEffect({
      active: true,
      idx,
      correct: isCorrect,
    });

    if (isCorrect) {
      soundFx.playCorrect();

      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);

      const timeBonus = Math.round(oxygen * 0.85);
      const comboBonus = nextCombo * 25;
      const pts = 120 + timeBonus + comboBonus;
      const newScore = score + pts;
      setScore(newScore);

      // Bioluminescent Teal-Aqua Confetti
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { x: 0.25 + idx * 0.18, y: 0.6 },
        colors: ['#06B6D4', '#14B8A6', '#38BDF8', '#FDE047', '#FFFFFF'],
      });

      if (newScore > highScore) {
        setHighScore(newScore);
        saveGameHighScore('deep_sea_treasure', newScore);
      }

      setTimeout(() => {
        setChestOpenEffect(null);
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
        setChestOpenEffect(null);
      }, 500);
    }
  };

  const endGame = (finalScore: number) => {
    setGameState('gameover');
    soundFx.playFanfare();

    const newHigh = saveGameHighScore('deep_sea_treasure', finalScore);
    setHighScore(newHigh);

    if (onSaveScore) {
      onSaveScore(finalScore, `ล่าสมบัติใต้ทะเลลึก: ได้คะแนน ${finalScore} แต้ม`, {
        highScore: newHigh,
        maxCombo,
      });
    }
  };

  return (
    <div
      className={`relative w-full max-w-3xl mx-auto bg-slate-950 text-white rounded-3xl border-2 transition-all duration-300 shadow-2xl overflow-hidden min-h-[580px] flex flex-col select-none ${
        chestOpenEffect?.correct
          ? 'border-teal-400 ring-8 ring-teal-500/90 shadow-[0_0_55px_#14b8a6]'
          : chestOpenEffect && !chestOpenEffect.correct
          ? 'border-rose-500 ring-8 ring-rose-500/80 shadow-[0_0_50px_#f43f5e]'
          : 'border-teal-500/40 shadow-teal-950/50'
      }`}
    >
      {/* Deep Ocean Blue Background with Bubble Rays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(20,184,166,0.18),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(15,23,42,0.9)_100%)] pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-teal-500/20 bg-slate-950/80 backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-slate-500"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับฮับเกม</span>
        </button>

        <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-mono">
          <div className="flex items-center gap-1 text-teal-300 font-bold">
            <span>🫧 หีบที่ {round} / {totalRounds}</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-300 font-bold">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>{score.toLocaleString()}</span>
          </div>

          {combo > 1 && (
            <div className="flex items-center gap-1 text-teal-300 font-extrabold animate-bounce">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>{combo}x ดำน้ำลึก</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-4 sm:p-6">
        {gameState === 'ready' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center text-4xl shadow-[0_0_35px_rgba(20,184,166,0.6)] animate-pulse">
              ⚓
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400 text-teal-300 text-xs font-bold uppercase tracking-widest">
                Ocean Odyssey • เกมที่ 15
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                ล่าสมบัติใต้ทะเลลึก (Deep Sea Odyssey)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                ดำดิ่งสู่ซากเรือโบราณก้นสมุทร! ปลดล็อกหีบสมบัติเรืองแสงที่มีตัวเลขคำนวณถูกต้องก่อนที่ออกซิเจนจะหมดลงใน 10 วินาที!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-teal-500/30 text-xs text-slate-300 space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <span className="text-teal-400 font-bold">⚓ หีบสมบัติ:</span> ประกายไข่มุกและอัญมณีใต้ทะเล
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-300 font-bold">⏱️ ออกซิเจน:</span> 10 วินาทีต่อหีบ รีบปลดล็อกรับสมบัติโบนัส
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-black text-base shadow-[0_0_35px_rgba(20,184,166,0.7)] active:scale-95 transition"
            >
              ⚓ เริ่มดำดิ่งสู่ก้นสมุทร (DIVE DEEP)
            </button>
          </div>
        )}

        {gameState === 'playing' && currentProblem && (
          <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full py-1">
            {/* HUD Target */}
            <div className="space-y-2 text-center">
              <div className="inline-block px-5 py-2.5 rounded-2xl bg-slate-900/90 border border-teal-500/50 shadow-[0_0_25px_rgba(20,184,166,0.35)] backdrop-blur-md">
                <span className="text-[11px] uppercase tracking-widest text-teal-400 font-bold block mb-0.5">
                  รหัสหีบสมบัติ {round} / {totalRounds}
                </span>
                <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wider">
                  {currentProblem.expression} = ?
                </span>
              </div>

              {/* 10s Oxygen Tank Bar */}
              <div className="space-y-1 max-w-xs mx-auto">
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span className="text-teal-300 font-bold">🫧 ออกซิเจนดำน้ำ</span>
                  <span className={`font-bold ${oxygen <= 30 ? 'text-rose-400 animate-pulse' : 'text-teal-300'}`}>
                    🫧 {(oxygen / 10).toFixed(1)}s / 10s
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700">
                  <div
                    className={`h-full transition-all duration-100 ${
                      oxygen > 50
                        ? 'bg-gradient-to-r from-teal-400 to-cyan-500'
                        : oxygen > 25
                        ? 'bg-gradient-to-r from-amber-400 to-cyan-500'
                        : 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse'
                    }`}
                    style={{ width: `${oxygen}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Ocean Depths & 4 Treasure Chests with Sinking Background Effect */}
            <div className="relative min-h-[270px] sm:min-h-[290px] my-2 rounded-3xl bg-gradient-to-b from-slate-950/90 via-teal-950/40 to-slate-950/95 border border-teal-500/30 overflow-hidden shadow-inner flex flex-col justify-between p-3.5 sm:p-4">
              {/* Dynamic Sinking Light Rays & Rising Marine Plankton Background */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Rising Bubble Streams (Simulates Options Sinking Down) */}
                <div className="absolute left-[10%] bottom-0 w-2 h-2 rounded-full bg-teal-400/40 animate-bubble-1" />
                <div className="absolute left-[25%] bottom-0 w-3 h-3 rounded-full bg-cyan-300/30 animate-bubble-2" />
                <div className="absolute left-[45%] bottom-0 w-1.5 h-1.5 rounded-full bg-teal-300/40 animate-bubble-3" />
                <div className="absolute left-[65%] bottom-0 w-2.5 h-2.5 rounded-full bg-cyan-400/30 animate-bubble-1" style={{ animationDelay: '1.8s' }} />
                <div className="absolute left-[82%] bottom-0 w-3 h-3 rounded-full bg-teal-200/40 animate-bubble-2" style={{ animationDelay: '0.8s' }} />
                <div className="absolute left-[92%] bottom-0 w-1.5 h-1.5 rounded-full bg-cyan-300/40 animate-bubble-3" style={{ animationDelay: '2.2s' }} />

                {/* Ambient Deep Sea Light Rays */}
                <div className="absolute -top-10 left-1/4 w-32 h-64 bg-gradient-to-b from-teal-400/10 via-cyan-500/5 to-transparent rotate-12 blur-xl animate-pulse" />
                <div className="absolute -top-10 right-1/4 w-36 h-64 bg-gradient-to-b from-cyan-400/10 via-teal-500/5 to-transparent -rotate-12 blur-xl animate-pulse" />
              </div>

              {/* Dynamic Submarine Depth Status */}
              {(() => {
                const currentDepth = 2000 + (round - 1) * 350 + Math.round((100 - oxygen) * 2.5);
                return (
                  <div className="text-center mb-1 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-950/80 border border-teal-400/50 text-teal-300 text-xs font-bold shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                      <span className="inline-block w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                      <span>🌊 กำลังดำดิ่งสู่ก้นสมุทร: {currentDepth.toLocaleString()} เมตร</span>
                    </div>
                  </div>
                );
              })()}

              {/* 4 Treasure Chest Buttons with Sinking Descent Sway */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 z-20 my-auto animate-ocean-descend">
                {currentProblem.options.slice(0, 4).map((opt, idx) => {
                  const isChestTarget = chestOpenEffect && chestOpenEffect.idx === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOpenChest(opt, idx)}
                      disabled={!!chestOpenEffect}
                      className={`relative w-full h-20 sm:h-24 rounded-2xl border-2 font-mono font-black text-base sm:text-xl flex flex-col items-center justify-center p-1.5 sm:p-2 transition-all duration-200 cursor-pointer shadow-lg active:scale-95 ${
                        isChestTarget
                          ? chestOpenEffect.correct
                            ? 'bg-gradient-to-b from-teal-400 via-cyan-500 to-blue-700 border-white text-white shadow-[0_0_40px_#14b8a6] scale-105 ring-4 ring-teal-300'
                            : 'bg-rose-950 border-rose-400 text-rose-200 shadow-[0_0_30px_#f43f5e] scale-95'
                          : 'bg-slate-900/90 hover:bg-slate-850 border-teal-500/40 hover:border-teal-300 text-teal-200 hover:shadow-[0_0_25px_rgba(20,184,166,0.6)]'
                      }`}
                    >
                      <div className="text-base sm:text-xl mb-0.5">
                        {isChestTarget && chestOpenEffect.correct ? '👑✨' : '💎'}
                      </div>
                      <div className="text-[10px] text-teal-300/80 mb-0.5 font-sans">หีบที่ {idx + 1}</div>
                      <span className="text-base sm:text-xl font-bold">{opt}</span>
                    </button>
                  );
                })}
              </div>

              <div className="text-center text-[11px] text-teal-300 font-mono mt-1 relative z-10">
                ⚓ แตะหีบสมบัติตัวเลขที่ถูกต้องเพื่อเปิดรับอัญมณีใต้ทะเล!
              </div>
            </div>

            <div className="text-center text-xs text-slate-400 font-medium">
              🫧 ดำน้ำล่าสมบัติอย่างแม่นยำก่อนออกซิเจนจะหมดลง!
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center text-teal-400 shadow-[0_0_35px_rgba(20,184,166,0.5)]">
              <Award className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">การล่าสมบัติสำเร็จ!</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                คุณค้นพบสมบัติใต้ทะเลลึกและคำนวณจำนวนเต็มได้อย่างแม่นยำ
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-500/40 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">มูลค่าสมบัติ:</span>
                <span className="text-teal-400 font-bold text-lg">{score.toLocaleString()} แต้ม</span>
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
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-black text-sm shadow-lg shadow-teal-500/30 transition flex items-center justify-center gap-2"
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
