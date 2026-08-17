import React, { useState, useEffect, useRef } from 'react';
import { Grid, Trophy, Timer, RefreshCw, ArrowLeft, Award, Sparkles, CheckCircle2, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getRandomInt, formatInteger } from '../../utils/gameMathGenerator';
import { soundFx } from '../../services/sound';
import { getGameHighScore, saveGameHighScore } from '../../utils/gameHighScore';

interface MathMatrixGameProps {
  onBack: () => void;
  onSaveScore?: (score: number, details: string) => void;
}

interface MatrixCell {
  id: number;
  val: number;
  isCleared: boolean;
}

export const MathMatrixGame: React.FC<MathMatrixGameProps> = ({ onBack, onSaveScore }) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getGameHighScore('math_matrix'));
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [targetOp, setTargetOp] = useState<'×' | '÷'>('×');
  const [targetResult, setTargetResult] = useState<number>(0);
  const [grid, setGrid] = useState<MatrixCell[]>([]);
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);
  const [matchesFound, setMatchesFound] = useState<number>(0);
  const [greenFlash, setGreenFlash] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateBoard = () => {
    // Pick target operation & result
    const op: '×' | '÷' = Math.random() > 0.5 ? '×' : '÷';
    const factor1 = getRandomInt(-9, 9, true);
    const factor2 = getRandomInt(-9, 9, true);

    let result = 0;
    let n1 = 0;
    let n2 = 0;

    if (op === '×') {
      result = factor1 * factor2;
      n1 = factor1;
      n2 = factor2;
    } else {
      result = factor1;
      n2 = factor2;
      n1 = result * n2;
    }

    setTargetOp(op);
    setTargetResult(result);

    // Create 12 cells with guaranteed solution pair + random plausible integers
    const numbers: number[] = [n1, n2];
    while (numbers.length < 12) {
      numbers.push(getRandomInt(-12, 12, true));
    }

    // Shuffle
    const cells: MatrixCell[] = numbers
      .sort(() => Math.random() - 0.5)
      .map((val, idx) => ({
        id: idx,
        val,
        isCleared: false,
      }));

    setGrid(cells);
    setSelectedCell(null);
  };

  const startGame = () => {
    soundFx.playPowerup();
    setScore(0);
    setMatchesFound(0);
    setTimeLeft(45);
    setGreenFlash(false);
    setGameState('playing');
    generateBoard();
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame(score);
          return 0;
        }
        if (t <= 5) soundFx.playCountdown();
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, score]);

  const handleSelectCell = (cell: MatrixCell) => {
    if (gameState !== 'playing' || cell.isCleared) return;

    soundFx.playClick();

    if (!selectedCell) {
      // First selection
      setSelectedCell(cell);
    } else if (selectedCell.id === cell.id) {
      // Deselect
      setSelectedCell(null);
    } else {
      // Second selection: Check match!
      const val1 = selectedCell.val;
      const val2 = cell.val;

      let isMatch = false;
      if (targetOp === '×') {
        isMatch = val1 * val2 === targetResult;
      } else {
        isMatch = (val2 !== 0 && val1 / val2 === targetResult) || (val1 !== 0 && val2 / val1 === targetResult);
      }

      if (isMatch) {
        // Successful match! Green Flash Effect
        soundFx.playCorrect();
        soundFx.playCombo(matchesFound + 1);
        setGreenFlash(true);
        setTimeout(() => setGreenFlash(false), 500);

        const pts = 150;
        const newScore = score + pts;
        setScore(newScore);
        const nextMatches = matchesFound + 1;
        setMatchesFound(nextMatches);

        if (newScore > highScore) {
          setHighScore(newScore);
          saveGameHighScore('math_matrix', newScore);
        }

        // Mark cleared
        setGrid((prev) =>
          prev.map((c) => (c.id === selectedCell.id || c.id === cell.id ? { ...c, isCleared: true } : c))
        );
        setSelectedCell(null);

        // Generate next target after short delay
        setTimeout(() => {
          generateBoard();
        }, 450);
      } else {
        // Wrong pair
        soundFx.playWrong();
        setSelectedCell(null);
      }
    }
  };

  const endGame = (finalScore: number) => {
    setGameState('gameover');
    soundFx.playFanfare();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    const newHigh = saveGameHighScore('math_matrix', finalScore);
    setHighScore(newHigh);
    if (onSaveScore) {
      onSaveScore(finalScore, `เมทริกซ์เชื่อมโยงผลคูณผลหาร: ${finalScore} แต้ม (จับคู่สำเร็จ ${matchesFound} คู่)`);
    }
  };

  return (
    <div className={`relative w-full max-w-3xl mx-auto bg-slate-950 text-white rounded-3xl border transition-all duration-200 shadow-2xl overflow-hidden min-h-[540px] flex flex-col select-none ${
      greenFlash
        ? 'border-emerald-400 ring-8 ring-emerald-500/80 shadow-2xl shadow-emerald-500/50'
        : 'border-blue-500/30'
    }`}>
      {/* Green Flash Wave Overlay */}
      {greenFlash && (
        <div className="absolute inset-0 z-30 bg-emerald-500/25 pointer-events-none animate-pulse flex items-center justify-center">
          <div className="text-center p-4 rounded-2xl bg-black/80 border-2 border-emerald-400">
            <span className="text-2xl font-black text-emerald-300">✨ ถูกต้อง! จับคู่สำเร็จ +150 แต้ม</span>
          </div>
        </div>
      )}

      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-950 to-black pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-blue-900/40 bg-slate-900/60 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition text-slate-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับเมนูเกม</span>
        </button>

        <div className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm font-mono">
          <div className="flex items-center gap-1 text-blue-400 font-bold">
            <Timer className={`w-4 h-4 ${timeLeft <= 5 ? 'animate-ping text-rose-500' : ''}`} />
            <span className={timeLeft <= 5 ? 'text-rose-400 font-black' : ''}>{timeLeft}s</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-300 font-bold">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>{score.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-950/50 px-2.5 py-1 rounded-xl border border-yellow-500/30 text-[11px] sm:text-xs">
            <Crown className="w-3.5 h-3.5 text-yellow-400" />
            <span>สูงสุด: {highScore.toLocaleString()}</span>
          </div>

          <div className="text-emerald-400 font-bold">
            จับคู่แล้ว {matchesFound} คู่
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-4 sm:p-6">
        {gameState === 'ready' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-4xl shadow-lg shadow-blue-500/20">
              🧩
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-300 via-indigo-200 to-white bg-clip-text text-transparent">
                เมทริกซ์เชื่อมโยงผลคูณผลหาร (Cross Match)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                หาตัวเลขจำนวนเต็ม 2 ช่องในตารางเมทริกซ์ที่ <strong>{targetOp === '×' ? 'คูณกัน' : 'หารกัน'}</strong> แล้วได้ผลลัพธ์ตามที่เป้าหมายกำหนด!
              </p>
            </div>

            {/* High Score Banner on Ready */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-sm font-bold">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span>คะแนนสูงสุด: {highScore.toLocaleString()} แต้ม</span>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-base shadow-lg shadow-blue-500/30 active:scale-95 transition"
            >
              🧩 เริ่มต่อตารางเมทริกซ์ (START)
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full py-1">
            {/* Clue Target Prompt */}
            <div className="text-center">
              <div className="inline-block px-5 py-3 rounded-2xl bg-slate-900/90 border border-blue-500/40 shadow-xl backdrop-blur-md">
                <span className="text-[11px] uppercase tracking-widest text-blue-400 font-bold block mb-0.5">
                  ภารกิจค้นหาตัวเลข 2 ช่อง
                </span>
                <span className="text-xl sm:text-2xl font-mono font-black text-white tracking-wider">
                  [ ช่องที่ 1 ] {targetOp} [ ช่องที่ 2 ] = <span className="text-amber-400 font-bold">{targetResult}</span>
                </span>
              </div>
            </div>

            {/* 4x3 Number Cells Grid */}
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3 my-auto">
              {grid.map((cell) => {
                const isSelected = selectedCell?.id === cell.id;
                return (
                  <button
                    key={cell.id}
                    onClick={() => handleSelectCell(cell)}
                    disabled={cell.isCleared}
                    className={`h-16 sm:h-20 rounded-2xl border-2 font-mono font-black text-xl sm:text-2xl transition active:scale-95 flex items-center justify-center shadow-md ${
                      cell.isCleared
                        ? 'opacity-10 bg-slate-900 border-slate-800'
                        : isSelected
                        ? 'bg-amber-500 text-black border-white scale-105 shadow-amber-500/50'
                        : 'bg-slate-900/90 hover:bg-slate-800 border-blue-800/60 hover:border-blue-400 text-blue-200'
                    }`}
                  >
                    <span>{cell.val}</span>
                  </button>
                );
              })}
            </div>

            {/* Instruction */}
            <div className="text-center text-xs text-slate-400 font-medium">
              💡 แตะเลือกตัวเลขช่องแรก แล้วแตะเลือกตัวเลขช่องที่สองที่ {targetOp === '×' ? 'คูณกัน' : 'หารกัน'} ได้ {targetResult}
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="my-auto text-center max-w-md mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <Award className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">หมดเวลาเชื่อมโยง!</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                สมองของคุณคิดเลขจำนวนเต็มและจับคู่ได้อย่างคล่องแคล่ว
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-blue-900/50 space-y-2 font-mono">
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
                <span className="text-slate-400">จำนวนคู่ที่จับสำเร็จ:</span>
                <span className="text-emerald-300 font-bold">{matchesFound} คู่</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
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

