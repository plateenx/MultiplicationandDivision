import React, { useState } from 'react';
import {
  Gamepad2,
  Rocket,
  Zap,
  Bomb,
  Swords,
  Target,
  Flame,
  Hammer,
  Grid,
  HelpCircle,
  Sparkles,
  Trophy,
  Play,
  Award,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { User, GameRecord } from '../../types';
import { supabaseService } from '../../services/supabaseService';
import { soundFx } from '../../services/sound';

// 10 Game Components
import { SpaceBlastGame } from './SpaceBlastGame';
import { SignFlashBattleGame } from './SignFlashBattleGame';
import { TimeBombDefuseGame } from './TimeBombDefuseGame';
import { BossBattleGame } from './BossBattleGame';
import { ArcheryTargetGame } from './ArcheryTargetGame';
import { FormulaDriftGame } from './FormulaDriftGame';
import { WhackMoleGame } from './WhackMoleGame';
import { MathMatrixGame } from './MathMatrixGame';
import { MemoryCardsGame } from './MemoryCardsGame';
import { BalloonPopGame } from './BalloonPopGame';

interface GameHubProps {
  currentUser: User | null;
}

interface GameDefinition {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  category: 'multiplication' | 'division' | 'mixed' | 'speed';
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  colorGrad: string;
  borderClass: string;
  glowClass: string;
}

const GAMES_LIST: GameDefinition[] = [
  {
    id: 'space_blast',
    number: 1,
    title: 'ยานอวกาศฝ่าดงดาวเคราะห์',
    subtitle: 'Space Math Blast',
    description: 'ยิงเลเซอร์ทำลายดาวเคราะห์โจทย์การคูณ/หารจำนวนเต็มก่อนพุ่งชนยาน',
    category: 'mixed',
    icon: Rocket,
    tag: 'ยานอวกาศ • ยิงเลเซอร์',
    colorGrad: 'from-indigo-600 to-violet-700',
    borderClass: 'border-indigo-500/40 hover:border-indigo-400',
    glowClass: 'shadow-indigo-500/20',
  },
  {
    id: 'sign_flash',
    number: 2,
    title: 'ประลองสปีดเครื่องหมาย',
    subtitle: 'Sign Flash Rush',
    description: 'วิเคราะห์เครื่องหมายลัพธ์ [+], [-], [0] อย่างรวดเร็วใน 30 วินาที',
    category: 'speed',
    icon: Zap,
    tag: 'ประลองความไว • 30s',
    colorGrad: 'from-amber-500 to-orange-600',
    borderClass: 'border-amber-500/40 hover:border-amber-400',
    glowClass: 'shadow-amber-500/20',
  },
  {
    id: 'time_bomb',
    number: 3,
    title: 'ปลดชนวนระเบิดเวลา',
    subtitle: 'Time Bomb Defuse',
    description: 'อ่านคำใบ้สมการแล้วตัดสายชนวนตัวเลขที่ถูกต้องก่อนระเบิดทำงาน',
    category: 'mixed',
    icon: Bomb,
    tag: 'กู้ระเบิด • ตื่นเต้น',
    colorGrad: 'from-rose-600 to-red-700',
    borderClass: 'border-rose-500/40 hover:border-rose-400',
    glowClass: 'shadow-rose-500/20',
  },
  {
    id: 'boss_battle',
    number: 4,
    title: 'ศึกต่อสู้บอสมอนสเตอร์',
    subtitle: 'Dungeon Boss Clash',
    description: 'คิดเลขจำนวนเต็มโจมตีมอนสเตอร์ ปราบบอส 3 ระดับด้วยคริติคอลฮิต',
    category: 'mixed',
    icon: Swords,
    tag: 'RPG ต่อสู้ • HP Bar',
    colorGrad: 'from-purple-600 to-pink-700',
    borderClass: 'border-purple-500/40 hover:border-purple-400',
    glowClass: 'shadow-purple-500/20',
  },
  {
    id: 'archery_target',
    number: 5,
    title: 'ยิงเป้าธนูมหาสนุก',
    subtitle: 'Target Bullseye Master',
    description: 'เป้าธนูตัวเลขเคลื่อนที่ซ้าย-ขวา เล็งและยิงธนูใส่คำตอบที่ถูกต้อง',
    category: 'multiplication',
    icon: Target,
    tag: 'ยิงเป้า • 10 รอบ',
    colorGrad: 'from-emerald-600 to-teal-700',
    borderClass: 'border-emerald-500/40 hover:border-emerald-400',
    glowClass: 'shadow-emerald-500/20',
  },
  {
    id: 'formula_drift',
    number: 6,
    title: 'ซิ่งรถดริฟต์คำนวณ',
    subtitle: 'Turbo Math Racer',
    description: 'ขับรถแข่งความเร็วสูง เปลี่ยน 3 เลนชนป้ายคำตอบที่ถูกต้อง หลบป้ายหลอก',
    category: 'speed',
    icon: Flame,
    tag: 'แข่งรถ • 3 เลนถนน',
    colorGrad: 'from-cyan-600 to-blue-700',
    borderClass: 'border-cyan-500/40 hover:border-cyan-400',
    glowClass: 'shadow-cyan-500/20',
  },
  {
    id: 'whack_mole',
    number: 7,
    title: 'ตุ่นขุดทองจำนวนเต็ม',
    subtitle: 'Whack-a-Mole Math',
    description: 'ตุ่นโผล่ขึ้นมาจากหลุมพร้อมป้ายคำตอบ ทุบให้ไวและแม่นยำที่สุด',
    category: 'division',
    icon: Hammer,
    tag: 'ทุบตุ่น • ตอบสนองไว',
    colorGrad: 'from-yellow-600 to-amber-700',
    borderClass: 'border-yellow-500/40 hover:border-yellow-400',
    glowClass: 'shadow-yellow-500/20',
  },
  {
    id: 'math_matrix',
    number: 8,
    title: 'เมทริกซ์เชื่อมโยงผลคูณผลหาร',
    subtitle: 'Cross Grid Match',
    description: 'จับคู่ตัวเลข 2 ช่องในตารางเมทริกซ์ที่คูณหรือหารกันแล้วได้ค่าตามเป้าหมาย',
    category: 'mixed',
    icon: Grid,
    tag: 'ตรรกะตาราง • จับคู่ 2 ช่อง',
    colorGrad: 'from-blue-600 to-indigo-700',
    borderClass: 'border-blue-500/40 hover:border-blue-400',
    glowClass: 'shadow-blue-500/20',
  },
  {
    id: 'memory_cards',
    number: 9,
    title: 'จับคู่การ์ดความจำ',
    subtitle: 'Memory Card Flip',
    description: 'พลิกการ์ดจับคู่ระหว่าง "การ์ดโจทย์จำนวนเต็ม" กับ "การ์ดผลลัพธ์"',
    category: 'multiplication',
    icon: HelpCircle,
    tag: 'การ์ดความจำ • พลิกคู่',
    colorGrad: 'from-violet-600 to-purple-700',
    borderClass: 'border-violet-500/40 hover:border-violet-400',
    glowClass: 'shadow-violet-500/20',
  },
  {
    id: 'balloon_pop',
    number: 10,
    title: 'ลูกโป่งเวทมนตร์ลอยฟ้า',
    subtitle: 'Floating Balloon Pop',
    description: 'ลูกโป่งตัวเลขลอยขึ้นฟ้า จิ้มระเบิดลูกโป่งที่เป็นคำตอบที่ถูกต้อง',
    category: 'division',
    icon: Sparkles,
    tag: 'ลูกโป่งลอย • ฟิสิกส์',
    colorGrad: 'from-pink-600 to-rose-700',
    borderClass: 'border-pink-500/40 hover:border-pink-400',
    glowClass: 'shadow-pink-500/20',
  },
];

export const GameHub: React.FC<GameHubProps> = ({ currentUser }) => {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);

  const handleLaunchGame = (gameId: string) => {
    soundFx.playClick();
    setActiveGameId(gameId);
  };

  const handleBackToHub = () => {
    soundFx.playClick();
    setActiveGameId(null);
  };

  const handleSaveGameScore = async (
    score: number,
    details: string,
    resultData?: Partial<GameRecord>
  ) => {
    if (!currentUser) return;
    try {
      const activeGameDef = GAMES_LIST.find((g) => g.id === activeGameId);
      const gameRecord: GameRecord = {
        id: `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        username: currentUser.username,
        fullName: `${currentUser.name} ${currentUser.surname}`,
        grade: currentUser.grade,
        room: currentUser.room,
        studentNo: currentUser.studentNo,
        gameId: activeGameId || 'math_game',
        gameTitle: activeGameDef?.title || 'เกมคณิตศาสตร์',
        gameCategory: activeGameDef?.category || 'mixed',
        score: score,
        highScore: resultData?.highScore || score,
        correctCount: resultData?.correctCount ?? Math.max(1, Math.round(score / 100)),
        totalQuestions: resultData?.totalQuestions ?? Math.max(1, Math.round(score / 90)),
        accuracyPercentage:
          resultData?.accuracyPercentage ??
          Math.min(100, Math.max(70, Math.round((score / 1000) * 100))),
        maxCombo: resultData?.maxCombo ?? 1,
        timeSpentSeconds: resultData?.timeSpentSeconds ?? 45,
        details: details || `บันทึกผลคะแนนเกม ${activeGameDef?.title || ''}`,
        specialMetrics: resultData?.specialMetrics || {},
        timestamp: new Date().toISOString(),
      };

      // 1. Record detailed game metrics in game_records table
      await supabaseService.recordGame(gameRecord);

      // 2. Also record in summary scores table for seamless compatibility with exercise leaderboards
      await supabaseService.recordScore({
        id: gameRecord.id,
        username: currentUser.username,
        fullName: `${currentUser.name} ${currentUser.surname}`,
        grade: currentUser.grade,
        room: currentUser.room,
        studentNo: currentUser.studentNo,
        operation:
          activeGameDef?.category === 'multiplication'
            ? 'multiplication'
            : activeGameDef?.category === 'division'
            ? 'division'
            : 'mixed',
        difficulty: 'medium',
        score: score,
        totalQuestions: gameRecord.totalQuestions,
        percentage: gameRecord.accuracyPercentage,
        timestamp: gameRecord.timestamp,
        details: `[เกม: ${gameRecord.gameTitle}] ${details}`,
      });

      setLastSavedMessage(
        `บันทึกผลเกม "${gameRecord.gameTitle}" ลงฐานข้อมูล Supabase สำเร็จ! (คะแนน ${score.toLocaleString()} แต้ม | ถูกต้อง ${gameRecord.correctCount}/${gameRecord.totalQuestions} ข้อ | ความแม่นยำ ${gameRecord.accuracyPercentage}%)`
      );
      setTimeout(() => setLastSavedMessage(null), 5000);
    } catch (e) {
      console.warn('Could not auto-save game score to Supabase', e);
    }
  };

  // Render Active Game View
  if (activeGameId === 'space_blast') {
    return <SpaceBlastGame onBack={handleBackToHub} onSaveScore={handleSaveGameScore} />;
  }
  if (activeGameId === 'sign_flash') {
    return <SignFlashBattleGame onBack={handleBackToHub} onSaveScore={handleSaveGameScore} />;
  }
  if (activeGameId === 'time_bomb') {
    return <TimeBombDefuseGame onBack={handleBackToHub} onSaveScore={handleSaveGameScore} />;
  }
  if (activeGameId === 'boss_battle') {
    return <BossBattleGame onBack={handleBackToHub} onSaveScore={handleSaveGameScore} />;
  }
  if (activeGameId === 'archery_target') {
    return <ArcheryTargetGame onBack={handleBackToHub} onSaveScore={handleSaveGameScore} />;
  }
  if (activeGameId === 'formula_drift') {
    return <FormulaDriftGame onBack={handleBackToHub} onSaveScore={handleSaveGameScore} />;
  }
  if (activeGameId === 'whack_mole') {
    return <WhackMoleGame onBack={handleBackToHub} onSaveScore={handleSaveGameScore} />;
  }
  if (activeGameId === 'math_matrix') {
    return <MathMatrixGame onBack={handleBackToHub} onSaveScore={handleSaveGameScore} />;
  }
  if (activeGameId === 'memory_cards') {
    return <MemoryCardsGame onBack={handleBackToHub} onSaveScore={handleSaveGameScore} />;
  }
  if (activeGameId === 'balloon_pop') {
    return <BalloonPopGame onBack={handleBackToHub} onSaveScore={handleSaveGameScore} />;
  }

  // Filtered Games List
  const filteredGames = GAMES_LIST.filter((game) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'multiplication') return game.category === 'multiplication';
    if (filterCategory === 'division') return game.category === 'division';
    if (filterCategory === 'speed') return game.category === 'speed' || game.category === 'mixed';
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 border border-indigo-700/40 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3">
            <Gamepad2 className="w-4 h-4" />
            <span>10 เกมคณิตศาสตร์จำนวนเต็มสุดตื่นเต้น</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            ศูนย์รวมเกมประลองความไว & กลยุทธ์
          </h2>

          <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
            เลือกเล่นเกมการคูณและการหารจำนวนเต็มทั้ง 10 เกม สนุก ตื่นเต้น ท้าทายความคิด และสะสมคะแนนเข้าสู่ตารางผู้นำ!
          </p>

          {/* Last Saved Score Notification */}
          {lastSavedMessage && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-xs font-bold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{lastSavedMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          {[
            { id: 'all', label: 'ทั้งหมด (10 เกม)' },
            { id: 'multiplication', label: 'การคูณจำนวนเต็ม' },
            { id: 'division', label: 'การหารจำนวนเต็ม' },
            { id: 'speed', label: 'ผสม & ประลองความไว' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundFx.playClick();
                setFilterCategory(tab.id);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterCategory === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          แสดง {filteredGames.length} จาก 10 เกม
        </div>
      </div>

      {/* 10 Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredGames.map((game) => {
          const Icon = game.icon;
          return (
            <div
              key={game.id}
              onClick={() => handleLaunchGame(game.id)}
              className={`group relative rounded-3xl bg-white dark:bg-slate-900/90 border ${game.borderClass} p-5 sm:p-6 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${game.glowClass} flex flex-col justify-between cursor-pointer`}
            >
              <div>
                {/* Top Badge & Number */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${game.colorGrad} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                    เกมที่ {game.number}
                  </span>
                </div>

                {/* Title & Subtitle */}
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {game.title}
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-2">
                  {game.subtitle}
                </p>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {game.description}
                </p>
              </div>

              {/* Bottom Tag & Play Button */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {game.tag}
                </span>

                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 group-hover:bg-indigo-600 text-indigo-600 dark:text-indigo-300 group-hover:text-white text-xs font-bold transition"
                >
                  <span>เล่นเลย</span>
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
