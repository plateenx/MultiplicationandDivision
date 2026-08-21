import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Brain,
  Gamepad2,
  Calculator,
  RefreshCw,
  Printer,
  Sparkles,
  BookOpen,
  Calendar,
  Flame,
  ShieldCheck,
  Star,
  UserCheck,
  Zap,
  Target,
  ArrowUpRight,
  PieChart,
  LogOut,
  LogIn,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { User, ScoreRecord, GameRecord, UserLog, SessionSummary } from '../types';
import { supabaseService } from '../services/supabaseService';
import { formatThaiDateTime } from '../utils/dateUtils';

interface MyScoreDashboardProps {
  currentUser: User | null;
  onNavigateToQuiz?: () => void;
  onNavigateToGames?: () => void;
}

export const MyScoreDashboard: React.FC<MyScoreDashboardProps> = ({
  currentUser,
  onNavigateToQuiz,
  onNavigateToGames,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'scores' | 'diagnostics' | 'history'>('scores');
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [gameRecords, setGameRecords] = useState<GameRecord[]>([]);
  const [userLogs, setUserLogs] = useState<UserLog[]>([]);
  const [sessionSummaries, setSessionSummaries] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters inside My Scores
  const [quizFilterOp, setQuizFilterOp] = useState<string>('ALL');
  const [gameFilterId, setGameFilterId] = useState<string>('ALL');

  // Pagination (10 items per page limit)
  const [quizPage, setQuizPage] = useState<number>(1);
  const [gamePage, setGamePage] = useState<number>(1);
  const [logPage, setLogPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  const loadUserData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const [fetchedScores, fetchedGames, fetchedLogs] = await Promise.all([
        supabaseService.fetchScores(),
        supabaseService.fetchGameRecords(),
        supabaseService.fetchUserLogs(),
      ]);

      // Filter only for current logged-in user
      const myUname = currentUser.username.toLowerCase();
      const myScores = fetchedScores.filter((s) => s.username.toLowerCase() === myUname);
      const myGames = fetchedGames.filter((g) => g.username.toLowerCase() === myUname);
      const myLogs = fetchedLogs.filter((l) => l.username.toLowerCase() === myUname);

      setScores(myScores);
      setGameRecords(myGames);
      setUserLogs(myLogs);
      setSessionSummaries(supabaseService.calculateSessionSummaries(myLogs));
    } catch (err) {
      console.warn('Error loading user scores and diagnostics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [currentUser]);

  // Derived user statistics
  const userStats = useMemo(() => {
    const totalQuizzes = scores.length;
    const quizSum = scores.reduce((sum, s) => sum + s.percentage, 0);
    const avgQuizAcc = totalQuizzes > 0 ? Math.round(quizSum / totalQuizzes) : 0;
    const perfectQuizzes = scores.filter((s) => s.percentage === 100).length;
    const passedQuizzes = scores.filter((s) => s.percentage >= 70).length;
    const passRate = totalQuizzes > 0 ? Math.round((passedQuizzes / totalQuizzes) * 100) : 0;

    const totalGames = gameRecords.length;
    const gameSum = gameRecords.reduce((sum, g) => sum + g.accuracyPercentage, 0);
    const avgGameAcc = totalGames > 0 ? Math.round(gameSum / totalGames) : 0;
    const highestGameScore = gameRecords.length > 0 ? Math.max(...gameRecords.map((g) => g.score)) : 0;
    const highestCombo = gameRecords.length > 0 ? Math.max(...gameRecords.map((g) => g.maxCombo || 0)) : 0;

    // Overall accuracy
    const combinedTotal = totalQuizzes + totalGames;
    const combinedAcc = combinedTotal > 0 ? Math.round((quizSum + gameSum) / combinedTotal) : 0;

    // Time spent
    const totalTimeInGamesSec = gameRecords.reduce((sum, g) => sum + (g.timeSpentSeconds || 0), 0);
    const userSession = sessionSummaries.find((s) => s.username.toLowerCase() === (currentUser?.username.toLowerCase() || ''));
    const totalSessionSec = userSession ? userSession.totalDurationSeconds : 0;
    const totalLearningSec = Math.max(totalSessionSec, totalTimeInGamesSec);

    // Mastery Tier calculation
    let masteryTier = 'ผู้ฝึกฝนเริ่มต้น (Novice)';
    let tierColor = 'text-slate-500 bg-slate-100 dark:bg-slate-800';
    let tierIcon = Star;
    if (combinedAcc >= 90 && combinedTotal >= 5) {
      masteryTier = 'ปรมาจารย์จำนวนเต็ม (Grandmaster)';
      tierColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700';
      tierIcon = Trophy;
    } else if (combinedAcc >= 80 && combinedTotal >= 3) {
      masteryTier = 'ผู้เชี่ยวชาญการคูณหาร (Expert)';
      tierColor = 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700';
      tierIcon = Award;
    } else if (combinedAcc >= 70 || combinedTotal >= 2) {
      masteryTier = 'นักคำนวณดาวรุ่ง (Skilled)';
      tierColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700';
      tierIcon = Zap;
    }

    return {
      totalQuizzes,
      avgQuizAcc,
      perfectQuizzes,
      passedQuizzes,
      passRate,
      totalGames,
      avgGameAcc,
      highestGameScore,
      highestCombo,
      combinedAcc,
      totalLearningSec,
      masteryTier,
      tierColor,
      tierIcon,
    };
  }, [scores, gameRecords, sessionSummaries, currentUser]);

  // Skill Diagnostics Breakdown
  const diagnostics = useMemo(() => {
    // Multiplication
    const multScores = scores.filter((s) => s.operation === 'multiplication');
    const multGames = gameRecords.filter((g) => g.gameCategory === 'multiplication');
    const multTotal = multScores.length + multGames.length;
    const multAcc = multTotal > 0
      ? Math.round(([...multScores.map((s) => s.percentage), ...multGames.map((g) => g.accuracyPercentage)].reduce((a, b) => a + b, 0)) / multTotal)
      : 0;

    // Division
    const divScores = scores.filter((s) => s.operation === 'division');
    const divGames = gameRecords.filter((g) => g.gameCategory === 'division');
    const divTotal = divScores.length + divGames.length;
    const divAcc = divTotal > 0
      ? Math.round(([...divScores.map((s) => s.percentage), ...divGames.map((g) => g.accuracyPercentage)].reduce((a, b) => a + b, 0)) / divTotal)
      : 0;

    // Mixed & Speed
    const mixScores = scores.filter((s) => s.operation === 'mixed');
    const mixGames = gameRecords.filter((g) => g.gameCategory === 'mixed' || g.gameCategory === 'speed');
    const mixTotal = mixScores.length + mixGames.length;
    const mixAcc = mixTotal > 0
      ? Math.round(([...mixScores.map((s) => s.percentage), ...mixGames.map((g) => g.accuracyPercentage)].reduce((a, b) => a + b, 0)) / mixTotal)
      : 0;

    // Strengths and Improvement areas
    const strengths: string[] = [];
    const improvements: string[] = [];
    const tips: string[] = [];

    if (multTotal > 0 && multAcc >= 80) {
      strengths.push('ความแม่นยำสูงในกฎการคูณจำนวนเต็ม (+ × +, + × -, - × -)');
    } else if (multTotal > 0 && multAcc < 70) {
      improvements.push('ต้องระวังกฎเครื่องหมายการคูณ: จำนวนลบคูณจำนวนลบ จะได้ผลลัพธ์เป็นจำนวนบวกเสมอ (- × - = +)');
      tips.push('ทบทวนบทเรียนการคูณในเมนู "สรุปความรู้" หรือฝึกด้วยเกม Speed Run / Flash Card');
    }

    if (divTotal > 0 && divAcc >= 80) {
      strengths.push('การหารจำนวนเต็มมีความคล่องแคล่วและเข้าใจกฎเครื่องหมายการหารอย่างถูกต้อง');
    } else if (divTotal > 0 && divAcc < 70) {
      improvements.push('ต้องระวังกฎเครื่องหมายการหาร: จำนวนต่างเครื่องหมายหารกัน ได้ผลลัพธ์ติดลบเสมอ (+ ÷ - = -)');
      tips.push('ฝึกแยกเครื่องหมายก่อนคำนวณขนาดตัวเลขในแบบฝึกหัดการหารจำนวนเต็ม');
    }

    if (mixTotal > 0 && mixAcc >= 80) {
      strengths.push('ความสามารถในการสลับบริบทระหว่างการคูณและการหารในโจทย์แบบผสมได้อย่างรวดเร็ว');
    } else if (mixTotal > 0 && mixAcc < 70) {
      improvements.push('การทำโจทย์แบบผสมอาจมีความเร่งรีบ ให้ตรวจสอบเครื่องหมายก่อนกดส่งคำตอบ');
      tips.push('ลองเล่นเกม Thunder Striker หรือ Ice Maze เพื่อฝึกสมาธิในการคูณและหาร');
    }

    if (strengths.length === 0 && scores.length + gameRecords.length === 0) {
      tips.push('เริ่มทำแบบฝึกหัดหรือเล่นเกมอย่างน้อย 1-2 ครั้ง เพื่อให้ระบบสร้างรายงานการวินิจฉัยความถนัดของคุณ');
    }

    if (strengths.length === 0 && scores.length + gameRecords.length > 0) {
      strengths.push('มีความตั้งใจในการฝึกฝนสม่ำเสมอ พยายามฝึกฝนเพิ่มเติมเพื่อเพิ่มอัตราความแม่นยำ');
    }

    return {
      multiplication: { total: multTotal, accuracy: multAcc, status: multAcc >= 80 ? 'ดีเยี่ยม' : multAcc >= 60 ? 'ปานกลาง' : 'ควรฝึกเพิ่ม' },
      division: { total: divTotal, accuracy: divAcc, status: divAcc >= 80 ? 'ดีเยี่ยม' : divAcc >= 60 ? 'ปานกลาง' : 'ควรฝึกเพิ่ม' },
      mixed: { total: mixTotal, accuracy: mixAcc, status: mixAcc >= 80 ? 'ดีเยี่ยม' : mixAcc >= 60 ? 'ปานกลาง' : 'ควรฝึกเพิ่ม' },
      strengths,
      improvements,
      tips,
    };
  }, [scores, gameRecords]);

  // Formatted duration helper
  const formatDuration = (totalSecs: number) => {
    if (totalSecs <= 0) return '0 วินาที';
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} ชม.`);
    if (mins > 0) parts.push(`${mins} นาที`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs} วิ.`);
    return parts.join(' ');
  };

  // Filtered lists
  const filteredScores = useMemo(() => {
    return scores.filter((s) => {
      if (quizFilterOp !== 'ALL' && s.operation !== quizFilterOp) return false;
      return true;
    });
  }, [scores, quizFilterOp]);

  const filteredGames = useMemo(() => {
    return gameRecords.filter((g) => {
      if (gameFilterId !== 'ALL' && g.gameId !== gameFilterId) return false;
      return true;
    });
  }, [gameRecords, gameFilterId]);

  // Paginated 10 items slices
  const totalQuizPages = Math.max(1, Math.ceil(filteredScores.length / ITEMS_PER_PAGE));
  const paginatedScores = useMemo(() => {
    const start = (quizPage - 1) * ITEMS_PER_PAGE;
    return filteredScores.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredScores, quizPage]);

  const totalGamePages = Math.max(1, Math.ceil(filteredGames.length / ITEMS_PER_PAGE));
  const paginatedGames = useMemo(() => {
    const start = (gamePage - 1) * ITEMS_PER_PAGE;
    return filteredGames.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredGames, gamePage]);

  const totalLogPages = Math.max(1, Math.ceil(userLogs.length / ITEMS_PER_PAGE));
  const paginatedLogs = useMemo(() => {
    const start = (logPage - 1) * ITEMS_PER_PAGE;
    return userLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [userLogs, logPage]);

  const handlePrintReport = () => {
    window.print();
  };

  if (!currentUser) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">กรุณาเข้าสู่ระบบก่อน</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          เพื่อดูผลคะแนน ประวัติการใช้งาน และผลการวิเคราะห์พัฒนาการเฉพาะบุคคลของคุณ
        </p>
      </div>
    );
  }

  const TierIconComponent = userStats.tierIcon;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn print:p-0 print:space-y-4">
      {/* Top Profile & Score Summary Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-900 border border-violet-700/50 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-10 w-48 h-48 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-amber-300 text-xs font-bold">
              <Award className="w-4 h-4" />
              <span>แฟ้มสะสมคะแนน & พัฒนาการส่วนบุคคล (My Learning Portfolio)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-3">
              <span>{currentUser.name} {currentUser.surname}</span>
              <span className="text-xs px-2.5 py-1 rounded-xl bg-white/15 border border-white/20 font-normal">
                {currentUser.grade ? `ม.${currentUser.grade}/${currentUser.room || 1} เลขที่ ${currentUser.studentNo || '-'}` : `@${currentUser.username}`}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed max-w-2xl">
              รายงานคะแนนแบบฝึกหัด สถิติเกมคณิตศาสตร์ ประวัติการเข้าใช้งาน และบทวิเคราะห์พัฒนาการเฉพาะบุคคลของคุณ
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center print:hidden">
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold transition active:scale-95 shadow-sm"
              title="พิมพ์ใบบันทึกผลการเรียนรู้"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>พิมพ์ใบบันทึกผล</span>
            </button>
            <button
              onClick={loadUserData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold transition active:scale-95 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'กำลังโหลด...' : 'รีเฟรช'}</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Highlight Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-violet-700/40">
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <div className="flex items-center justify-between text-xs text-indigo-200 font-medium mb-1">
              <span>ความแม่นยำรวม</span>
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {userStats.combinedAcc}%
            </div>
            <div className="text-[11px] text-emerald-300 mt-0.5">
              แบบฝึกหัด {userStats.avgQuizAcc}% | เกม {userStats.avgGameAcc}%
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <div className="flex items-center justify-between text-xs text-indigo-200 font-medium mb-1">
              <span>ทำแบบฝึกหัด</span>
              <Calculator className="w-4 h-4 text-indigo-300" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {userStats.totalQuizzes} <span className="text-xs font-normal text-indigo-200">ครั้ง</span>
            </div>
            <div className="text-[11px] text-amber-300 mt-0.5">
              เต็ม 100%: {userStats.perfectQuizzes} ครั้ง
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <div className="flex items-center justify-between text-xs text-indigo-200 font-medium mb-1">
              <span>เล่นเกมคณิต</span>
              <Gamepad2 className="w-4 h-4 text-violet-300" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {userStats.totalGames} <span className="text-xs font-normal text-indigo-200">รอบ</span>
            </div>
            <div className="text-[11px] text-violet-300 mt-0.5">
              High: {userStats.highestGameScore.toLocaleString()} | Combo: {userStats.highestCombo}x
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <div className="flex items-center justify-between text-xs text-indigo-200 font-medium mb-1">
              <span>เวลาเรียนสะสม</span>
              <Clock className="w-4 h-4 text-amber-300" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 truncate">
              {formatDuration(userStats.totalLearningSec)}
            </div>
            <div className="text-[11px] text-indigo-200 mt-0.5 truncate">
              ระดับ: {userStats.masteryTier.split(' ')[0]}
            </div>
          </div>
        </div>

        {/* Navigation Tabs inside My Scores */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-violet-700/40 pt-4 print:hidden">
          <button
            onClick={() => setActiveSubTab('scores')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeSubTab === 'scores'
                ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>ผลคะแนนของฉัน ({scores.length + gameRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('diagnostics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeSubTab === 'diagnostics'
                ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>วิเคราะห์พัฒนาการรายทักษะ</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeSubTab === 'history'
                ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>ประวัติการเข้าใช้งาน & เวลาเรียน</span>
          </button>
        </div>
      </div>

      {/* ===================== VIEW 1: MY SCORES ===================== */}
      {activeSubTab === 'scores' && (
        <div className="space-y-6">
          {/* Section A: My Quiz Scores */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    บันทึกคะแนนแบบฝึกหัดของฉัน
                  </h3>
                  <p className="text-xs text-slate-500">
                    รวมทั้งสิ้น {scores.length} ครั้ง | ผ่านเกณฑ์ (≥70%): {userStats.passedQuizzes} ครั้ง
                  </p>
                </div>
              </div>

              {/* Quiz Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">หัวข้อ:</label>
                <select
                  value={quizFilterOp}
                  onChange={(e) => {
                    setQuizFilterOp(e.target.value);
                    setQuizPage(1);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">ทุกหัวข้อแบบฝึกหัด</option>
                  <option value="multiplication">การคูณจำนวนเต็ม</option>
                  <option value="division">การหารจำนวนเต็ม</option>
                  <option value="mixed">ผสมการคูณและการหาร</option>
                </select>
              </div>
            </div>

            {filteredScores.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs space-y-3">
                <Calculator className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 stroke-[1.5]" />
                <p>ยังไม่มีบันทึกคะแนนแบบฝึกหัดในหัวข้อนี้</p>
                {onNavigateToQuiz && (
                  <button
                    onClick={onNavigateToQuiz}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    <span>ไปทำแบบฝึกหัดตอนนี้</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>
                    แสดงผล <strong className="text-slate-800 dark:text-slate-200">{paginatedScores.length}</strong> รายการ (จากทั้งหมด {filteredScores.length} รายการ | กำหนดเสนอ 10 รายการต่อหน้า)
                  </span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    หน้า {quizPage} / {totalQuizPages}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                        <th className="py-2.5 px-3">ลำดับ</th>
                        <th className="py-2.5 px-3">หัวข้อแบบฝึกหัด</th>
                        <th className="py-2.5 px-3">ระดับความยาก</th>
                        <th className="py-2.5 px-3">คะแนนที่ได้</th>
                        <th className="py-2.5 px-3">ร้อยละ</th>
                        <th className="py-2.5 px-3">ผลการประเมิน</th>
                        <th className="py-2.5 px-3">วัน-เวลาที่ทำ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {paginatedScores.map((s, idx) => (
                        <tr key={s.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-mono text-slate-400">{(quizPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                          <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                            {s.operation === 'multiplication' && 'การคูณจำนวนเต็ม'}
                            {s.operation === 'division' && 'การหารจำนวนเต็ม'}
                            {s.operation === 'mixed' && 'ผสมการคูณและการหาร'}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                s.difficulty === 'easy'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                                  : s.difficulty === 'medium'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                                  : 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                              }`}
                            >
                              {s.difficulty === 'easy' ? 'ระดับง่าย' : s.difficulty === 'medium' ? 'ระดับปานกลาง' : 'ระดับยาก'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-black text-slate-900 dark:text-white">
                            {s.score} / {s.totalQuestions}
                          </td>
                          <td className="py-3 px-3 font-black">
                            <span
                              className={
                                s.percentage >= 80
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : s.percentage >= 60
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }
                            >
                              {s.percentage}%
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {s.percentage >= 70 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" /> ผ่านเกณฑ์
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500">
                                <AlertCircle className="w-3.5 h-3.5" /> ควรฝึกเพิ่ม
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                            {formatThaiDateTime(s.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls for Quiz Scores */}
                {totalQuizPages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setQuizPage((prev) => Math.max(1, prev - 1))}
                      disabled={quizPage === 1}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>ก่อนหน้า</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalQuizPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalQuizPages > 5 && quizPage > 3) {
                          pageNum = Math.min(totalQuizPages - 4 + i, Math.max(1, quizPage - 2 + i));
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setQuizPage(pageNum)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                              quizPage === pageNum
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setQuizPage((prev) => Math.min(totalQuizPages, prev + 1))}
                      disabled={quizPage === totalQuizPages}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <span>ถัดไป</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section B: My Game Highscores & Performance */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    บันทึกผลเกมคณิตศาสตร์ของฉัน (15 เกม)
                  </h3>
                  <p className="text-xs text-slate-500">
                    เล่นไปแล้ว {gameRecords.length} รอบ | คะแนนสูงสุด: {userStats.highestGameScore.toLocaleString()} แต้ม
                  </p>
                </div>
              </div>

              {/* Game Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">เลือกเกม:</label>
                <select
                  value={gameFilterId}
                  onChange={(e) => {
                    setGameFilterId(e.target.value);
                    setGamePage(1);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">รวมทุกเกม (15 เกม)</option>
                  <option value="game-1">1. Speed Run ผจญภัยดินแดนตัวเลข</option>
                  <option value="game-2">2. Bubble Pop สอยฟองสบู่</option>
                  <option value="game-3">3. Flash Card การ์ดประลองปัญญา</option>
                  <option value="game-4">4. Number Match จับคู่สมการ</option>
                  <option value="game-5">5. Wheel of Fortune วงล้อมหาสนุก</option>
                  <option value="game-6">6. Equation Builder นักสร้างสมการ</option>
                  <option value="game-7">7. Sign Battle ศึกประลองเครื่องหมาย</option>
                  <option value="game-8">8. Space Invaders ปกป้องอวกาศ</option>
                  <option value="game-9">9. Whack-a-Mole ตุ่นคณิตศาสตร์</option>
                  <option value="game-10">10. Treasure Hunter ล่าสมบัติจำนวนเต็ม</option>
                  <option value="game-11">11. Lava Jump กระโดดข้ามลาวา</option>
                  <option value="game-12">12. Thunder Striker สายฟ้าฟาดคำตอบ</option>
                  <option value="game-13">13. Ice Maze เขาวงกตน้ำแข็ง</option>
                  <option value="game-14">14. Neon Matrix แมทริกซ์นีออน</option>
                  <option value="game-15">15. Deep Sea Odyssey ดำดิ่งก้นทะเล</option>
                </select>
              </div>
            </div>

            {filteredGames.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs space-y-3">
                <Gamepad2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 stroke-[1.5]" />
                <p>ยังไม่มีบันทึกการเล่นเกมในรายการนี้</p>
                {onNavigateToGames && (
                  <button
                    onClick={onNavigateToGames}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    <span>ไปเล่นเกมประลองปัญญา</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>
                    แสดงผล <strong className="text-slate-800 dark:text-slate-200">{paginatedGames.length}</strong> รายการ (จากทั้งหมด {filteredGames.length} รอบ | กำหนดเสนอ 10 รายการต่อหน้า)
                  </span>
                  <span className="font-semibold text-violet-600 dark:text-violet-400">
                    หน้า {gamePage} / {totalGamePages}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                        <th className="py-2.5 px-3">ลำดับ</th>
                        <th className="py-2.5 px-3">ชื่อเกม</th>
                        <th className="py-2.5 px-3">คะแนนที่ทำได้</th>
                        <th className="py-2.5 px-3">คอมโบสูงสุด</th>
                        <th className="py-2.5 px-3">ความแม่นยำ</th>
                        <th className="py-2.5 px-3">ตอบถูก / ทั้งหมด</th>
                        <th className="py-2.5 px-3">เวลาที่ใช้</th>
                        <th className="py-2.5 px-3">วัน-เวลาที่เล่น</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {paginatedGames.map((g, idx) => (
                        <tr key={g.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-mono text-slate-400">{(gamePage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                          <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                            {g.gameTitle}
                          </td>
                          <td className="py-3 px-3 font-black text-amber-500">
                            {g.score.toLocaleString()} แต้ม
                          </td>
                          <td className="py-3 px-3 font-bold text-violet-500">
                            {g.maxCombo ? `${g.maxCombo}x` : '-'}
                          </td>
                          <td className="py-3 px-3 font-black">
                            <span
                              className={
                                g.accuracyPercentage >= 80
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-indigo-600 dark:text-indigo-400'
                              }
                            >
                              {g.accuracyPercentage}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-semibold">
                            {g.correctCount} / {g.totalQuestions}
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-mono">
                            {g.timeSpentSeconds ? `${g.timeSpentSeconds} วิ.` : '-'}
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                            {formatThaiDateTime(g.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls for Game Records */}
                {totalGamePages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setGamePage((prev) => Math.max(1, prev - 1))}
                      disabled={gamePage === 1}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>ก่อนหน้า</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalGamePages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalGamePages > 5 && gamePage > 3) {
                          pageNum = Math.min(totalGamePages - 4 + i, Math.max(1, gamePage - 2 + i));
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setGamePage(pageNum)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                              gamePage === pageNum
                                ? 'bg-violet-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setGamePage((prev) => Math.min(totalGamePages, prev + 1))}
                      disabled={gamePage === totalGamePages}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <span>ถัดไป</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== VIEW 2: MY DIAGNOSTICS ===================== */}
      {activeSubTab === 'diagnostics' && (
        <div className="space-y-6">
          {/* Skill Radar / Mastery Bars */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  ผลการวินิจฉัยความชำนาญรายทักษะ (Skill Mastery Breakdown)
                </h3>
                <p className="text-xs text-slate-500">
                  ประเมินจากแบบฝึกหัดและเกมคณิตศาสตร์ที่ทำสำเร็จทั้งหมด
                </p>
              </div>
            </div>

            {/* 3 Major Skills Bars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Multiplication */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    การคูณจำนวนเต็ม (+ × +, + × -, - × -)
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      diagnostics.multiplication.accuracy >= 80
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                        : diagnostics.multiplication.accuracy >= 60
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                    }`}
                  >
                    {diagnostics.multiplication.status}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {diagnostics.multiplication.accuracy}%
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ฝึก {diagnostics.multiplication.total} ครั้ง
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                    style={{ width: `${diagnostics.multiplication.accuracy}%` }}
                  />
                </div>
              </div>

              {/* Division */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    การหารจำนวนเต็ม (+ ÷ +, - ÷ -, + ÷ -)
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      diagnostics.division.accuracy >= 80
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                        : diagnostics.division.accuracy >= 60
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                    }`}
                  >
                    {diagnostics.division.status}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {diagnostics.division.accuracy}%
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ฝึก {diagnostics.division.total} ครั้ง
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${diagnostics.division.accuracy}%` }}
                  />
                </div>
              </div>

              {/* Mixed */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    การคิดคำนวณผสมและการประยุกต์
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      diagnostics.mixed.accuracy >= 80
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                        : diagnostics.mixed.accuracy >= 60
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                    }`}
                  >
                    {diagnostics.mixed.status}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-violet-600 dark:text-violet-400">
                    {diagnostics.mixed.accuracy}%
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ฝึก {diagnostics.mixed.total} ครั้ง
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${diagnostics.mixed.accuracy}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostics Insights & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths Card */}
            <div className="p-6 rounded-3xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-3">
              <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>จุดเด่นและความถนัดของคุณ (Strengths)</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {diagnostics.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvement Card */}
            <div className="p-6 rounded-3xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-3">
              <h4 className="font-bold text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>คำแนะนำเชิงพัฒนาการสำหรับคุณ (Personalized Action Plan)</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {diagnostics.improvements.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold mt-0.5">⚠️</span>
                    <span>{imp}</span>
                  </li>
                ))}
                {diagnostics.tips.map((tip, idx) => (
                  <li key={`tip-${idx}`} className="flex items-start gap-2">
                    <span className="text-indigo-500 font-bold mt-0.5">💡</span>
                    <span className="text-indigo-900 dark:text-indigo-300 font-medium">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ===================== VIEW 3: USAGE HISTORY & LOGS ===================== */}
      {activeSubTab === 'history' && (
        <div className="space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400">เวลาเข้าใช้งานรวม</div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {formatDuration(userStats.totalLearningSec)}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <LogIn className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400">จำนวนครั้งที่เข้าสู่ระบบ</div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {userLogs.filter((l) => l.action === 'SIGN_IN').length} ครั้ง
                </div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400">สถานะปัจจุบัน</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>กำลังออนไลน์</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Logs Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              <span>ประวัติการเข้าและออกจากระบบ (Sign In / Sign Out Logs)</span>
            </h3>

            {userLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                ยังไม่มีบันทึกประวัติการเข้าใช้งาน
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>
                    แสดงผล <strong className="text-slate-800 dark:text-slate-200">{paginatedLogs.length}</strong> รายการ (จากทั้งหมด {userLogs.length} รายการ | กำหนดเสนอ 10 รายการต่อหน้า)
                  </span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    หน้า {logPage} / {totalLogPages}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                        <th className="py-2.5 px-3">ลำดับ</th>
                        <th className="py-2.5 px-3">กิจกรรม (Action)</th>
                        <th className="py-2.5 px-3">วันและเวลาที่บันทึก</th>
                        <th className="py-2.5 px-3">อุปกรณ์ / เบราว์เซอร์</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {paginatedLogs.map((log, idx) => (
                        <tr key={log.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-mono text-slate-400">{(logPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                          <td className="py-3 px-3 font-bold">
                            {log.action === 'SIGN_IN' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                <LogIn className="w-3.5 h-3.5" /> เข้าสู่ระบบ (Sign In)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                <LogOut className="w-3.5 h-3.5" /> ออกจากระบบ (Sign Out)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                            {formatThaiDateTime(log.timestamp)}
                          </td>
                          <td className="py-3 px-3 text-slate-400 truncate max-w-xs">
                            {log.device || 'Web Browser'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls for User Logs */}
                {totalLogPages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setLogPage((prev) => Math.max(1, prev - 1))}
                      disabled={logPage === 1}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>ก่อนหน้า</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalLogPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalLogPages > 5 && logPage > 3) {
                          pageNum = Math.min(totalLogPages - 4 + i, Math.max(1, logPage - 2 + i));
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setLogPage(pageNum)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                              logPage === pageNum
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setLogPage((prev) => Math.min(totalLogPages, prev + 1))}
                      disabled={logPage === totalLogPages}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <span>ถัดไป</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
