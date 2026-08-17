import React, { useState, useEffect, useRef } from 'react';
import { Target, Trophy, RefreshCw, ArrowLeft, Award, Sparkles, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateIntegerProblem, GameMathProblem, getRandomInt, formatInteger } from '../../utils/gameMathGenerator';
import { soundFx } from '../../services/sound';
import { getGameHighScore, saveGameHighScore } from '../../utils/gameHighScore';

interface ArcheryTargetGameProps {
  onBack: () => void;
  onSaveScore?: (score: number, details: string) => void;
}

interface TargetItem {
  id: number;
  value: number;
  isCorrect: boolean;
  xPos: number; // percentage
  speed: number;
  direction: number; // 1 or -1
}

interface ArrowShot {
  targetX: number;
  progress: number; // 0 to 100%
  hitTargetId: number | null;
}

export const ArcheryTargetGame: React.FC<ArcheryTargetGameProps> = ({ onBack, onSaveScore }) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [round, setRound] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getGameHighScore('archery_target'));
  const [currentProblem, setCurrentProblem] = useState<GameMathProblem | null>(null);
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [arrowShot, setArrowShot] = useState<ArrowShot | null>(null);
  const [hitExplosion, setHitExplosion] = useState<{ xPos: number; correct: boolean; value: number } | null>(null);
  const [hitFeedback, setHitFeedback] = useState<{ text: string; correct: boolean } | null>(null);

  const totalRounds = 10;
  const isShootingRef = useRef<boolean>(false);

  const nextRound = (currentRnd: number) => {
    if (currentRnd > totalRounds) {
      endGame(score);
      return;
    }

    const prob = generateIntegerProblem('mixed', 'medium');
    setCurrentProblem(prob);

    const generatedTargets: TargetItem[] = prob.options.map((val, idx) => ({
      id: idx,
      value: val,
      isCorrect: val === prob.answer,
      xPos: 15 + idx * 22,
      speed: 0.35 + Math.random() * 0.35,
      direction: Math.random() > 0.5 ? 1 : -1,
    }));

    setTargets(generatedTargets);
    isShootingRef.current = false;
  };

  const startGame = () => {
    soundFx.playPowerup();
    setScore(0);
    setRound(1);
    setHitExplosion(null);
    setArrowShot(null);
    setGameState('playing');
    nextRound(1);
  };

  // Animate target horizontal motion
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setTargets((prev) =>
        prev.map((t) => {
          let nextX = t.xPos + t.speed * t.direction;
          let nextDir = t.direction;
          if (nextX <= 8) {
            nextX = 8;
            nextDir = 1;
          } else if (nextX >= 92) {
            nextX = 92;
            nextDir = -1;
          }
          return { ...t, xPos: nextX, direction: nextDir };
        })
      );
    }, 35);

    return () => clearInterval(interval);
  }, [gameState]);

  const handleShootTarget = (target: TargetItem) => {
    if (isShootingRef.current || gameState !== 'playing') return;
    isShootingRef.current = true;

    soundFx.playLaser();

    // Start arrow flying animation towards target's current xPos
    const targetX = target.xPos;
    setArrowShot({ targetX, progress: 0, hitTargetId: target.id });

    // Rapid progress update
    let prog = 0;
    const arrowInterval = setInterval(() => {
      prog += 25;
      if (prog >= 100) {
        clearInterval(arrowInterval);
        setArrowShot(null);

        // Arrow reaches target!
        if (target.isCorrect) {
          // Green Explosion effect!
          soundFx.playExplosion();
          soundFx.playCorrect();
          soundFx.playCombo(round);
          setHitExplosion({ xPos: targetX, correct: true, value: target.value });

          const earned = 150;
          const newScore = score + earned;
          setScore(newScore);

          if (newScore > highScore) {
            setHighScore(newScore);
            saveGameHighScore('archery_target', newScore);
          }

          setHitFeedback({ text: `🎯 เข้าเป้าแม่นยำ! +${earned} แต้ม`, correct: true });
        } else {
          soundFx.playWrong();
          setHitExplosion({ xPos: targetX, correct: false, value: target.value });
          setHitFeedback({ text: `❌ พลาดเป้า! คำตอบคือ ${currentProblem?.answer}`, correct: false });
        }

        setTimeout(() => {
          setHitExplosion(null);
          setHitFeedback(null);
          setRound((r) => {
            const nextR = r + 1;
            nextRound(nextR);
            return nextR;
          });
        }, 850);
      } else {
        setArrowShot((prev) => prev ? { ...prev, progress: prog } : null);
      }
    }, 45);
  };

  const endGame = (finalScore: number) => {
    setGameState('gameover');
    soundFx.playFanfare();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    const newHigh = saveGameHighScore('archery_target', finalScore);
    setHighScore(newHigh);
    if (onSaveScore) {
      onSaveScore(finalScore, `ยิงเป้าธนูมหาสนุก: ${finalScore} แต้ม (10 รอบ)`);
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto bg-slate-950 text-white rounded-3xl border border-emerald-500/30 shadow-2xl overflow-hidden min-h-[540px] flex flex-col select-none">
      {/* Background Archery Range */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950 to-black pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-emerald-900/40 bg-slate-900/60 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition text-slate-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับเมนูเกม</span>
        </button>

        <div className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm font-mono">
          <div className="text-emerald-400 font-bold">
            รอบที่ {round} / {totalRounds}
          </div>

          <div className="flex items-center gap-1.5 text-yellow-300 font-bold">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>{score.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-950/50 px-2.5 py-1 rounded-xl border border-yellow-500/30 text-[11px] sm:text-xs">
            <Crown className="w-3.5 h-3.5 text-yellow-400" />
            <span>สูงสุด: {highScore.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-4 sm:p-6">
        {gameState === 'ready' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <Target className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent">
                ยิงเป้าธนูมหาสนุก (Target Master)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                เป้าธนูตัวเลขจะเคลื่อนไหวซ้าย-ขวา กดเลือกคำตอบเพื่อปล่อยลูกธนูพุ่งใส่เป้า หากถูกต้องจะเกิดการระเบิดสีเขียวพร้อมรับคะแนน!
              </p>
            </div>

            {/* High Score Banner on Ready */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-sm font-bold">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span>คะแนนสูงสุด: {highScore.toLocaleString()} แต้ม</span>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base shadow-lg shadow-emerald-500/30 active:scale-95 transition"
            >
              🎯 เริ่มยิงธนู (START)
            </button>
          </div>
        )}

        {gameState === 'playing' && currentProblem && (
          <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full py-2">
            {/* Clue Prompt */}
            <div className="text-center">
              <div className="inline-block p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 shadow-xl backdrop-blur-md">
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold block mb-1">
                  โจทย์เป้าหมาย
                </span>
                <span className="text-3xl sm:text-4xl font-mono font-black text-white tracking-wider">
                  {currentProblem.expression} = ?
                </span>
              </div>
            </div>

            {/* Archery Moving Targets Track & Shooting Canvas */}
            <div className="relative h-56 sm:h-64 bg-slate-900/60 rounded-3xl border border-slate-800 my-auto overflow-hidden shadow-inner flex flex-col justify-between p-3">
              {/* Feedback Popup */}
              {hitFeedback && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs">
                  <span className={`px-4 py-2 rounded-2xl text-base font-black shadow-2xl animate-bounce ${
                    hitFeedback.correct ? 'bg-emerald-500 text-white shadow-emerald-500/50' : 'bg-rose-500 text-white shadow-rose-500/50'
                  }`}>
                    {hitFeedback.text}
                  </span>
                </div>
              )}

              {/* Green / Red Explosion Blast Wave on Hit Target */}
              {hitExplosion && (
                <div
                  className="absolute z-25 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
                  style={{ left: `${hitExplosion.xPos}%`, top: '35%' }}
                >
                  <div className={`w-28 h-28 rounded-full animate-ping opacity-90 ${
                    hitExplosion.correct
                      ? 'bg-emerald-400 shadow-2xl shadow-emerald-400 ring-8 ring-emerald-300'
                      : 'bg-rose-500 shadow-2xl shadow-rose-500'
                  }`} />
                  <span className="absolute text-2xl font-black">
                    {hitExplosion.correct ? '💥✨' : '❌'}
                  </span>
                </div>
              )}

              {/* Moving Targets (Top Track) */}
              <div className="relative h-24 w-full">
                {targets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleShootTarget(t)}
                    style={{ left: `${t.xPos}%` }}
                    className="absolute top-2 transform -translate-x-1/2 focus:outline-none group active:scale-90 transition-transform"
                  >
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-rose-600 via-amber-400 to-rose-600 p-0.5 shadow-lg shadow-rose-950/60 border-2 border-white/80 flex items-center justify-center hover:scale-110 transition">
                      <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                        <span className="font-mono font-black text-base sm:text-lg text-white">
                          {t.value}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Flying Arrow In Flight */}
              {arrowShot && (
                <div
                  className="absolute pointer-events-none transition-all duration-75 z-20"
                  style={{
                    left: `${50 + ((arrowShot.targetX - 50) * arrowShot.progress) / 100}%`,
                    bottom: `${10 + (arrowShot.progress * 65) / 100}%`,
                    transform: 'translate(-50%, 50%) rotate(-45deg)',
                  }}
                >
                  <div className="text-3xl filter drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">
                    🏹
                  </div>
                </div>
              )}

              {/* Bow at the Bottom */}
              <div className="text-center pb-1">
                <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] inline-block animate-bounce">
                  🏹
                </span>
              </div>
            </div>

            {/* Bow / Instructions */}
            <div className="text-center text-xs text-slate-400 font-medium">
              🎯 แตะหรือคลิกที่เป้าตัวเลขเพื่อยิงธนูพุ่งใส่เป้าหมาย!
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <Award className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">จบการแข่งขันยิงธนู!</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                คุณผ่านการทดสอบความแม่นยำครบทั้ง 10 รอบแล้ว
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-900/50 space-y-2 font-mono">
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
            </div>

            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
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

