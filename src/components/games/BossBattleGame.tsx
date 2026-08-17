import React, { useState, useEffect, useRef } from 'react';
import { Swords, Shield, Heart, Zap, Sparkles, RefreshCw, Trophy, ArrowLeft, Award, Flame, Timer, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateIntegerProblem, GameMathProblem } from '../../utils/gameMathGenerator';
import { soundFx } from '../../services/sound';
import { getGameHighScore, saveGameHighScore } from '../../utils/gameHighScore';

interface BossBattleGameProps {
  onBack: () => void;
  onSaveScore?: (score: number, details: string) => void;
}

interface Boss {
  name: string;
  avatar: string;
  maxHp: number;
  attackPower: number;
  bgGrad: string;
}

const BOSSES: Boss[] = [
  { name: 'สไลม์ยักษ์เขี้ยวพิษ', avatar: '👾', maxHp: 300, attackPower: 20, bgGrad: 'from-emerald-950 to-slate-950' },
  { name: 'มังกรเพลิงโลกันตร์', avatar: '🐉', maxHp: 500, attackPower: 25, bgGrad: 'from-orange-950 to-slate-950' },
  { name: 'จอมมารไททันเงาอสูร', avatar: '👹', maxHp: 800, attackPower: 35, bgGrad: 'from-purple-950 to-slate-950' },
];

export const BossBattleGame: React.FC<BossBattleGameProps> = ({ onBack, onSaveScore }) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'victory' | 'gameover'>('ready');
  const [bossStage, setBossStage] = useState<number>(0);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [bossHp, setBossHp] = useState<number>(300);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getGameHighScore('boss_battle'));
  const [combo, setCombo] = useState<number>(0);
  const [currentProblem, setCurrentProblem] = useState<GameMathProblem | null>(null);
  const [actionEffect, setActionEffect] = useState<{ text: string; type: 'player' | 'boss' | 'crit' } | null>(null);
  const [shieldActive, setShieldActive] = useState<boolean>(false);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(20);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentBoss = BOSSES[bossStage] || BOSSES[0];

  const nextProblem = () => {
    const prob = generateIntegerProblem('mixed', bossStage === 0 ? 'easy' : bossStage === 1 ? 'medium' : 'hard');
    setCurrentProblem(prob);
    setQuestionTimeLeft(20);
  };

  const startGame = () => {
    soundFx.playPowerup();
    setBossStage(0);
    setPlayerHp(100);
    setBossHp(BOSSES[0].maxHp);
    setScore(0);
    setCombo(0);
    setGameState('playing');
    nextProblem();
  };

  // 20-second per question countdown timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          // Timeout! Boss attacks player automatically!
          handleQuestionTimeout();
          return 20;
        }
        if (prev <= 5) {
          soundFx.playCountdown();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, currentProblem, bossStage, playerHp]);

  const handleQuestionTimeout = () => {
    soundFx.playWrong();
    soundFx.playExplosion();
    setCombo(0);

    const bossDmg = currentBoss.attackPower;
    setActionEffect({ text: `⏰ หมดเวลา 20 วิ! ${currentBoss.name} โจมตีใส่คุณ -${bossDmg} HP`, type: 'boss' });

    setPlayerHp((prev) => {
      const nextHp = prev - bossDmg;
      if (nextHp <= 0) {
        setTimeout(() => handleGameOver(score), 700);
        return 0;
      }
      return nextHp;
    });

    setTimeout(() => {
      setActionEffect(null);
      nextProblem();
    }, 1100);
  };

  const handleSelectOption = (chosen: number) => {
    if (gameState !== 'playing' || !currentProblem) return;

    const isFast = questionTimeLeft >= 14;

    if (chosen === currentProblem.answer) {
      // Player attacks!
      soundFx.playHit();
      const newCombo = combo + 1;
      setCombo(newCombo);
      soundFx.playCombo(newCombo);

      const baseDmg = 85;
      const crit = isFast ? 1.5 : 1.0;
      const damage = Math.round((baseDmg + newCombo * 10) * crit);
      const points = 100 + (isFast ? 60 : 0) + newCombo * 20 + questionTimeLeft * 5;
      const newScore = score + points;
      setScore(newScore);

      if (newScore > highScore) {
        setHighScore(newScore);
        saveGameHighScore('boss_battle', newScore);
      }

      if (isFast) {
        setActionEffect({ text: `⚡ CRITICAL SPEED HIT! ฟันเข้าจุดตาย -${damage} HP`, type: 'crit' });
      } else {
        setActionEffect({ text: `⚔️ โจมตีสำเร็จ! -${damage} HP`, type: 'player' });
      }

      setBossHp((prev) => {
        const nextBossHp = prev - damage;
        if (nextBossHp <= 0) {
          // Defeated this boss!
          setTimeout(() => handleBossDefeated(newScore), 500);
          return 0;
        }
        return nextBossHp;
      });

      setTimeout(() => {
        setActionEffect(null);
        nextProblem();
      }, 700);
    } else {
      // Player missed, boss counterattacks!
      soundFx.playWrong();
      setCombo(0);

      setTimeout(() => {
        soundFx.playExplosion();
        if (shieldActive) {
          setActionEffect({ text: '🛡️ โล่เวทมนตร์บล็อกการโจมตีของบอสได้!', type: 'player' });
          setShieldActive(false);
        } else {
          const bossDmg = currentBoss.attackPower;
          setActionEffect({ text: `💥 คำตอบผิด! ${currentBoss.name} โจมตีสวนกลับ! -${bossDmg} HP`, type: 'boss' });
          setPlayerHp((prev) => {
            const nextHp = prev - bossDmg;
            if (nextHp <= 0) {
              setTimeout(() => handleGameOver(score), 600);
              return 0;
            }
            return nextHp;
          });
        }
      }, 400);

      setTimeout(() => {
        setActionEffect(null);
        nextProblem();
      }, 1200);
    }
  };

  const handleGameOver = (finalScore: number) => {
    setGameState('gameover');
    soundFx.playFanfare();
    const newHigh = saveGameHighScore('boss_battle', finalScore);
    setHighScore(newHigh);
    if (onSaveScore) {
      onSaveScore(finalScore, `ศึกต่อสู้บอสมอนสเตอร์: ${finalScore} แต้ม (ด่านที่ ${bossStage + 1})`);
    }
  };

  const handleBossDefeated = (currentTotalScore: number) => {
    soundFx.playFanfare();
    confetti({ particleCount: 60, spread: 60 });

    if (bossStage < BOSSES.length - 1) {
      // Advance to next boss
      const nextStage = bossStage + 1;
      setBossStage(nextStage);
      setBossHp(BOSSES[nextStage].maxHp);
      setPlayerHp((hp) => Math.min(hp + 50, 100)); // Heal bonus
      setActionEffect({ text: `🎉 ปราบบอสสำเร็จ! ด่านถัดไป: ${BOSSES[nextStage].name}`, type: 'crit' });
      setTimeout(() => {
        setActionEffect(null);
        nextProblem();
      }, 1500);
    } else {
      // Full victory!
      setGameState('victory');
      soundFx.playFanfare();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      const victoryScore = currentTotalScore + 1000;
      setScore(victoryScore);
      const newHigh = saveGameHighScore('boss_battle', victoryScore);
      setHighScore(newHigh);
      if (onSaveScore) {
        onSaveScore(victoryScore, `ศึกต่อสู้บอสมอนสเตอร์: ชนะสมบูรณ์! ${victoryScore} แต้ม`);
      }
    }
  };

  return (
    <div className={`relative w-full max-w-3xl mx-auto bg-slate-950 text-white rounded-3xl border border-purple-900/40 shadow-2xl overflow-hidden min-h-[540px] flex flex-col select-none bg-gradient-to-b ${currentBoss.bgGrad}`}>
      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-purple-900/40 bg-slate-900/60 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition text-slate-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับเมนูเกม</span>
        </button>

        <div className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm font-mono">
          <div className="flex items-center gap-1.5 text-yellow-300 font-bold">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>{score.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-950/50 px-2.5 py-1 rounded-xl border border-yellow-500/30 text-[11px] sm:text-xs">
            <Crown className="w-3.5 h-3.5 text-yellow-400" />
            <span>สูงสุด: {highScore.toLocaleString()}</span>
          </div>

          <div className="px-2.5 py-0.5 rounded-full bg-purple-900/80 border border-purple-500 text-purple-300 text-[11px] font-bold">
            ด่านที่ {bossStage + 1} / {BOSSES.length}
          </div>
        </div>
      </div>

      {/* Main Battle Arena */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-4 sm:p-6">
        {gameState === 'ready' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-4xl shadow-lg shadow-purple-500/20">
              ⚔️
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-300 via-pink-200 to-white bg-clip-text text-transparent">
                ศึกต่อสู้บอสมอนสเตอร์
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                คิดเลขการคูณและการหารจำนวนเต็มให้ถูกต้องเพื่อฟันดาบโจมตีบอส <strong>จับเวลาข้อละ 20 วินาที</strong> หากตอบช้าบอสจะโจมตีคุณ!
              </p>
            </div>

            {/* High Score Banner on Ready */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-sm font-bold">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span>คะแนนสูงสุด: {highScore.toLocaleString()} แต้ม</span>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-base shadow-lg shadow-purple-500/30 active:scale-95 transition"
            >
              🥊 เข้าสู่สนามประลอง (START)
            </button>
          </div>
        )}

        {gameState === 'playing' && currentProblem && (
          <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full py-1 space-y-3">
            {/* 20-Second Question Timer Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1 text-slate-300">
                  <Timer className={`w-3.5 h-3.5 ${questionTimeLeft <= 5 ? 'text-rose-500 animate-ping' : 'text-purple-400'}`} />
                  <span>เวลาตอบข้อนี้:</span>
                </span>
                <span className={`font-black ${questionTimeLeft <= 5 ? 'text-rose-400 animate-pulse text-sm' : 'text-yellow-300'}`}>
                  {questionTimeLeft} วินาที
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-purple-900/50">
                <div
                  className={`h-full transition-all duration-300 ${
                    questionTimeLeft > 10 ? 'bg-gradient-to-r from-purple-500 to-indigo-400' : questionTimeLeft > 5 ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'
                  }`}
                  style={{ width: `${(questionTimeLeft / 20) * 100}%` }}
                />
              </div>
            </div>

            {/* HP Statuses: Player vs Boss */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Player HP */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-md space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">🧙‍♂️ ผู้กล้า (คุณ)</span>
                  <span className="font-mono text-emerald-400 font-bold">{playerHp}/100</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.max(playerHp, 0)}%` }}
                  />
                </div>
              </div>

              {/* Boss HP */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-purple-900/80 shadow-md space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-300 truncate">{currentBoss.avatar} {currentBoss.name}</span>
                  <span className="font-mono text-rose-400 font-bold">{bossHp}/{currentBoss.maxHp}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-all duration-300"
                    style={{ width: `${Math.max((bossHp / currentBoss.maxHp) * 100, 0)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Battle Stage Visual */}
            <div className="relative text-center py-2">
              {actionEffect && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <span className={`px-4 py-2 rounded-2xl text-sm sm:text-base font-black shadow-xl animate-bounce ${
                    actionEffect.type === 'crit'
                      ? 'bg-amber-500 text-black'
                      : actionEffect.type === 'player'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}>
                    {actionEffect.text}
                  </span>
                </div>
              )}

              {/* Boss Avatar Monster */}
              <div className="text-6xl sm:text-7xl mb-1 animate-pulse select-none">
                {currentBoss.avatar}
              </div>

              {/* Math Spell Expression */}
              <div className="inline-block p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/40 shadow-xl backdrop-blur-md">
                <span className="text-[11px] uppercase tracking-widest text-indigo-400 font-bold block mb-1">
                  ร่ายเวทคำนวณเพื่อโจมตี
                </span>
                <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wider">
                  {currentProblem.expression} = ?
                </span>
              </div>
            </div>

            {/* Attack Buttons */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2.5">
                {currentProblem.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(opt)}
                    className="py-3.5 px-3 rounded-2xl bg-slate-900/90 hover:bg-indigo-950 border border-purple-800 hover:border-indigo-400 font-mono font-black text-xl text-indigo-200 transition active:scale-95 shadow-md flex items-center justify-center gap-2"
                  >
                    <Swords className="w-4 h-4 text-purple-400 opacity-60" />
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {(gameState === 'victory' || gameState === 'gameover') && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <Award className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {gameState === 'victory' ? '🏆 ชัยชนะอันยิ่งใหญ่!' : '💀 พ่ายแพ้ในการต่อสู้'}
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                {gameState === 'victory'
                  ? 'คุณสามารถปราบจอมมารทั้ง 3 ตนด้วยพลังคณิตศาสตร์จำนวนเต็มอันยอดเยี่ยม!'
                  : 'พลังชีวิตหมดลง ฝึกฝนแล้วกลับมาท้าประลองใหม่ได้เสมอ!'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-900/50 space-y-2 font-mono">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">คะแนนการต่อสู้:</span>
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
                <span className="text-slate-400">ด่านที่ไปถึง:</span>
                <span className="text-purple-300 font-bold">{bossStage + 1} / {BOSSES.length}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="flex-1 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
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

