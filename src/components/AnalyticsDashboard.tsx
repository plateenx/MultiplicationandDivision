import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Brain,
  Trophy,
  Clock,
  User as UserIcon,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Activity,
  Award,
  Zap,
  Sparkles,
  Gamepad2,
  Calculator,
  Flame,
  HelpCircle,
  RefreshCw,
  Eye,
  Layers,
  GraduationCap,
  Users,
  Building,
  Target,
  ArrowUpRight,
  BookOpen,
  PieChart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { User, ScoreRecord, GameRecord, UserLog, SessionSummary } from '../types';
import { supabaseService } from '../services/supabaseService';
import { formatThaiDateTime, parseDateSafely } from '../utils/dateUtils';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

interface AnalyticsDashboardProps {
  currentUser: User | null;
}

type MainTab = 'scores_history' | 'diagnostic_center';
type ScopeFilter = 'ALL' | 'GRADE' | 'ROOM' | 'INDIVIDUAL';

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ currentUser }) => {
  // Main Tab State
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('diagnostic_center');

  // Sub tab for Scores & History
  const [scoresSubTab, setScoresSubTab] = useState<'scores' | 'games' | 'sessions' | 'logs'>('scores');

  // Filter for specific Quiz Operation & Game Mode
  const [selectedQuizOp, setSelectedQuizOp] = useState<string>('ALL');
  const [selectedGameId, setSelectedGameId] = useState<string>('ALL');

  // Multi-dimensional Scope Filters
  const [scope, setScope] = useState<ScopeFilter>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [selectedUsername, setSelectedUsername] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [gameRecords, setGameRecords] = useState<GameRecord[]>([]);
  const [userLogs, setUserLogs] = useState<UserLog[]>([]);
  const [sessionSummaries, setSessionSummaries] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 10 Items per Page Pagination States
  const ITEMS_PER_PAGE = 10;
  const [matrixPage, setMatrixPage] = useState<number>(1);
  const [quizPage, setQuizPage] = useState<number>(1);
  const [gamePage, setGamePage] = useState<number>(1);
  const [sessionPage, setSessionPage] = useState<number>(1);
  const [logPage, setLogPage] = useState<number>(1);

  // Daily Score Trend Chart States (Recharts)
  const [trendWindow, setTrendWindow] = useState<'7D' | '14D' | '30D' | 'ALL'>('14D');
  const [trendMetric, setTrendMetric] = useState<'all' | 'overall_only' | 'quiz_vs_game'>('all');
  const [showVolumeBars, setShowVolumeBars] = useState<boolean>(true);

  // Reset page numbers on filter changes
  useEffect(() => {
    setMatrixPage(1);
    setQuizPage(1);
    setGamePage(1);
    setSessionPage(1);
    setLogPage(1);
  }, [scope, selectedGrade, selectedRoom, selectedUsername, searchKeyword, selectedQuizOp, selectedGameId]);

  // Load all data from Supabase & Local Cache
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [fetchedUsers, fetchedScores, fetchedGames, fetchedLogs] = await Promise.all([
        supabaseService.fetchUsers(),
        supabaseService.fetchScores(),
        supabaseService.fetchGameRecords(),
        supabaseService.fetchUserLogs(),
      ]);

      setUsers(fetchedUsers);
      setScores(fetchedScores);
      setGameRecords(fetchedGames);
      setUserLogs(fetchedLogs);
      setSessionSummaries(supabaseService.calculateSessionSummaries(fetchedLogs));
    } catch (err) {
      console.warn('Error loading analytics data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Set default individual if user clicks individual
  useEffect(() => {
    if (scope === 'INDIVIDUAL' && selectedUsername === 'ALL' && currentUser) {
      setSelectedUsername(currentUser.username);
    }
  }, [scope, currentUser, selectedUsername]);

  // Derived unique grades and rooms from users and scores
  const availableGrades = useMemo(() => {
    const gradesSet = new Set<string>();
    users.forEach((u) => u.grade && gradesSet.add(String(u.grade)));
    scores.forEach((s) => s.grade && gradesSet.add(String(s.grade)));
    gameRecords.forEach((g) => g.grade && gradesSet.add(String(g.grade)));
    return Array.from(gradesSet).sort((a, b) => Number(a) - Number(b));
  }, [users, scores, gameRecords]);

  const availableRooms = useMemo(() => {
    const roomsSet = new Set<string>();
    users.forEach((u) => {
      if (selectedGrade === 'ALL' || String(u.grade) === selectedGrade) {
        if (u.room) roomsSet.add(String(u.room));
      }
    });
    scores.forEach((s) => {
      if (selectedGrade === 'ALL' || String(s.grade) === selectedGrade) {
        if (s.room) roomsSet.add(String(s.room));
      }
    });
    return Array.from(roomsSet).sort((a, b) => Number(a) - Number(b));
  }, [users, scores, selectedGrade]);

  // Consolidated user list for individual selection
  const allStudents = useMemo(() => {
    const map = new Map<string, { username: string; fullName: string; grade?: number | string; room?: number | string; studentNo?: number | string }>();
    users.forEach((u) => map.set(u.username.toLowerCase(), { username: u.username, fullName: `${u.name} ${u.surname}`, grade: u.grade, room: u.room, studentNo: u.studentNo }));
    scores.forEach((s) => {
      if (!map.has(s.username.toLowerCase())) {
        map.set(s.username.toLowerCase(), { username: s.username, fullName: s.fullName, grade: s.grade, room: s.room, studentNo: s.studentNo });
      }
    });
    gameRecords.forEach((g) => {
      if (!map.has(g.username.toLowerCase())) {
        map.set(g.username.toLowerCase(), { username: g.username, fullName: g.fullName, grade: g.grade, room: g.room, studentNo: g.studentNo });
      }
    });
    return Array.from(map.values());
  }, [users, scores, gameRecords]);

  // Filtered records according to 4-Scope Selection
  const filterByScope = <T extends { username: string; grade?: number | string; room?: number | string; fullName?: string }>(records: T[]): T[] => {
    return records.filter((item) => {
      // Keyword search
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchesName = item.fullName?.toLowerCase().includes(kw);
        const matchesUser = item.username.toLowerCase().includes(kw);
        if (!matchesName && !matchesUser) return false;
      }

      if (scope === 'ALL') return true;

      if (scope === 'GRADE') {
        if (selectedGrade !== 'ALL' && String(item.grade) !== selectedGrade) return false;
        return true;
      }

      if (scope === 'ROOM') {
        if (selectedGrade !== 'ALL' && String(item.grade) !== selectedGrade) return false;
        if (selectedRoom !== 'ALL' && String(item.room) !== selectedRoom) return false;
        return true;
      }

      if (scope === 'INDIVIDUAL') {
        if (selectedUsername !== 'ALL' && item.username.toLowerCase() !== selectedUsername.toLowerCase()) {
          return false;
        }
        return true;
      }

      return true;
    });
  };

  const filteredScores = useMemo(() => {
    return filterByScope<ScoreRecord>(scores).filter((s) => {
      if (selectedQuizOp !== 'ALL' && s.operation !== selectedQuizOp) return false;
      return true;
    });
  }, [scores, scope, selectedGrade, selectedRoom, selectedUsername, searchKeyword, selectedQuizOp]);

  const filteredGameRecords = useMemo(() => {
    return filterByScope<GameRecord>(gameRecords).filter((g) => {
      if (selectedGameId !== 'ALL' && g.gameId !== selectedGameId) return false;
      return true;
    });
  }, [gameRecords, scope, selectedGrade, selectedRoom, selectedUsername, searchKeyword, selectedGameId]);

  const filteredLogs = useMemo(() => filterByScope(userLogs), [userLogs, scope, selectedGrade, selectedRoom, selectedUsername, searchKeyword]);
  const filteredSessions = useMemo(() => filterByScope(sessionSummaries), [sessionSummaries, scope, selectedGrade, selectedRoom, selectedUsername, searchKeyword]);

  const filteredStudents = useMemo(() => {
    return allStudents.filter((st) => {
      if (scope === 'GRADE' && selectedGrade !== 'ALL' && String(st.grade) !== selectedGrade) return false;
      if (scope === 'ROOM') {
        if (selectedGrade !== 'ALL' && String(st.grade) !== selectedGrade) return false;
        if (selectedRoom !== 'ALL' && String(st.room) !== selectedRoom) return false;
      }
      if (scope === 'INDIVIDUAL' && selectedUsername !== 'ALL' && st.username.toLowerCase() !== selectedUsername.toLowerCase()) return false;
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        if (!st.fullName.toLowerCase().includes(kw) && !st.username.toLowerCase().includes(kw)) return false;
      }
      return true;
    });
  }, [allStudents, scope, selectedGrade, selectedRoom, selectedUsername, searchKeyword]);

  // Paginated Slices (Strict 10 items per page limit)
  const totalMatrixPages = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));
  const paginatedStudents = useMemo(() => {
    const start = (matrixPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, matrixPage]);

  const totalQuizPages = Math.max(1, Math.ceil(filteredScores.length / ITEMS_PER_PAGE));
  const paginatedScores = useMemo(() => {
    const start = (quizPage - 1) * ITEMS_PER_PAGE;
    return filteredScores.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredScores, quizPage]);

  const totalGamePages = Math.max(1, Math.ceil(filteredGameRecords.length / ITEMS_PER_PAGE));
  const paginatedGames = useMemo(() => {
    const start = (gamePage - 1) * ITEMS_PER_PAGE;
    return filteredGameRecords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredGameRecords, gamePage]);

  const totalSessionPages = Math.max(1, Math.ceil(filteredSessions.length / ITEMS_PER_PAGE));
  const paginatedSessions = useMemo(() => {
    const start = (sessionPage - 1) * ITEMS_PER_PAGE;
    return filteredSessions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSessions, sessionPage]);

  const totalLogPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));
  const paginatedLogs = useMemo(() => {
    const start = (logPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, logPage]);

  // DIAGNOSTIC CALCULATIONS
  const diagnostics = useMemo(() => {
    const totalQuizAttempts = filteredScores.length;
    const totalGamesPlayed = filteredGameRecords.length;
    const totalRecords = totalQuizAttempts + totalGamesPlayed;

    if (totalRecords === 0) {
      return {
        avgScore: 0,
        avgAccuracy: 0,
        masteryLevel: 'กำลังรวบรวมข้อมูล',
        passRate: 0,
        skillBreakdown: {
          multiplication: { total: 0, accuracy: 0, status: 'ไม่มีข้อมูล' },
          division: { total: 0, accuracy: 0, status: 'ไม่มีข้อมูล' },
          mixed: { total: 0, accuracy: 0, status: 'ไม่มีข้อมูล' },
          negativeSigns: { total: 0, accuracy: 0, status: 'ไม่มีข้อมูล' },
        },
        misconceptions: [] as string[],
        recommendations: [] as string[],
        growthTrend: 'กำลังประเมิน',
        highMasteryCount: 0,
        mediumMasteryCount: 0,
        supportNeededCount: 0,
      };
    }

    // Average Accuracy
    let sumAccuracy = 0;
    filteredScores.forEach((s) => (sumAccuracy += s.percentage));
    filteredGameRecords.forEach((g) => (sumAccuracy += g.accuracyPercentage));
    const avgAccuracy = Math.round(sumAccuracy / totalRecords);

    // Pass rate (% with accuracy >= 70%)
    const passedCount =
      filteredScores.filter((s) => s.percentage >= 70).length +
      filteredGameRecords.filter((g) => g.accuracyPercentage >= 70).length;
    const passRate = Math.round((passedCount / totalRecords) * 100);

    // Skill breakdowns
    const multScores = filteredScores.filter((s) => s.operation === 'multiplication');
    const multGames = filteredGameRecords.filter((g) => g.gameCategory === 'multiplication');
    const multAcc = Math.round(
      ([...multScores.map((s) => s.percentage), ...multGames.map((g) => g.accuracyPercentage)].reduce((a, b) => a + b, 0) ||
        0) / (multScores.length + multGames.length || 1)
    );

    const divScores = filteredScores.filter((s) => s.operation === 'division');
    const divGames = filteredGameRecords.filter((g) => g.gameCategory === 'division');
    const divAcc = Math.round(
      ([...divScores.map((s) => s.percentage), ...divGames.map((g) => g.accuracyPercentage)].reduce((a, b) => a + b, 0) ||
        0) / (divScores.length + divGames.length || 1)
    );

    const mixScores = filteredScores.filter((s) => s.operation === 'mixed');
    const mixGames = filteredGameRecords.filter((g) => g.gameCategory === 'mixed' || g.gameCategory === 'speed');
    const mixAcc = Math.round(
      ([...mixScores.map((s) => s.percentage), ...mixGames.map((g) => g.accuracyPercentage)].reduce((a, b) => a + b, 0) ||
        0) / (mixScores.length + mixGames.length || 1)
    );

    // Misconceptions & Diagnostics
    const misconceptions: string[] = [];
    const recommendations: string[] = [];

    if (multAcc < 70 && multScores.length + multGames.length > 0) {
      misconceptions.push('ความสับสนกฎเครื่องหมายการคูณ: การคูณจำนวนลบด้วยจำนวนลบ (- × -) มักตอบเป็นจำนวนลบ');
      recommendations.push('ทบทวนความเข้าใจ "ลบคูณลบเป็นบวก" ผ่านแบบจำลองเส้นจำนวนและเกมประลองสปีดเครื่องหมาย');
    }
    if (divAcc < 70 && divScores.length + divGames.length > 0) {
      misconceptions.push('ความเข้าใจคลาดเคลื่อนการหารจำนวนเต็ม: การหารจำนวนบวกด้วยลบ หรือลบด้วยบวกได้ผลลัพธ์เป็นลบ');
      recommendations.push('ฝึกฝนการแยกเครื่องหมายก่อนคำนวณขนาดตัวเลขในแบบฝึกหัดการหารจำนวนเต็ม');
    }
    if (mixAcc < 65 && mixScores.length + mixGames.length > 0) {
      misconceptions.push('ความสับสนเมื่อมีโจทย์คูณและหารผสมกัน หรือการเร่งรีบในการตอบโจทย์จับเวลา');
      recommendations.push('ฝึกทำโจทย์แบบผสมความเร็วปานกลาง โดยตรวจเช็กเครื่องหมายอย่างรอบคอบก่อนส่งคำตอบ');
    }

    if (misconceptions.length === 0) {
      misconceptions.push('ไม่พบความเข้าใจคลาดเคลื่อนรุนแรง ผู้เรียนมีความแม่นยำในกฎเครื่องหมายและการคิดคำนวณดีเยี่ยม');
      recommendations.push('ส่งเสริมให้ท้าทายระดับยาก (Hard) ในเกมและแบบฝึกหัดขั้นสูงเพื่อพัฒนาความคล่องแคล่วต่อเนื่อง');
    }

    // Student Group Distribution
    const userAccMap: Record<string, { total: number; sum: number }> = {};
    filteredScores.forEach((s) => {
      if (!userAccMap[s.username]) userAccMap[s.username] = { total: 0, sum: 0 };
      userAccMap[s.username].total += 1;
      userAccMap[s.username].sum += s.percentage;
    });
    filteredGameRecords.forEach((g) => {
      if (!userAccMap[g.username]) userAccMap[g.username] = { total: 0, sum: 0 };
      userAccMap[g.username].total += 1;
      userAccMap[g.username].sum += g.accuracyPercentage;
    });

    let high = 0;
    let medium = 0;
    let support = 0;

    Object.values(userAccMap).forEach((u) => {
      const avg = u.sum / u.total;
      if (avg >= 80) high++;
      else if (avg >= 60) medium++;
      else support++;
    });

    return {
      avgScore: avgAccuracy,
      avgAccuracy,
      masteryLevel: avgAccuracy >= 80 ? 'เชี่ยวชาญระดับสูง (Advanced)' : avgAccuracy >= 60 ? 'กำลังพัฒนา (Proficient)' : 'ต้องการเสริมแรง (Needs Support)',
      passRate,
      skillBreakdown: {
        multiplication: {
          total: multScores.length + multGames.length,
          accuracy: multAcc || 0,
          status: multAcc >= 80 ? 'ดีเยี่ยม' : multAcc >= 60 ? 'ปานกลาง' : 'ควรฝึกเพิ่ม',
        },
        division: {
          total: divScores.length + divGames.length,
          accuracy: divAcc || 0,
          status: divAcc >= 80 ? 'ดีเยี่ยม' : divAcc >= 60 ? 'ปานกลาง' : 'ควรฝึกเพิ่ม',
        },
        mixed: {
          total: mixScores.length + mixGames.length,
          accuracy: mixAcc || 0,
          status: mixAcc >= 80 ? 'ดีเยี่ยม' : mixAcc >= 60 ? 'ปานกลาง' : 'ควรฝึกเพิ่ม',
        },
      },
      misconceptions,
      recommendations,
      growthTrend: avgAccuracy >= 75 ? 'ก้าวหน้าต่อเนื่อง (+)' : 'คงที่ / เฝ้าระวัง',
      highMasteryCount: high,
      mediumMasteryCount: medium,
      supportNeededCount: support,
    };
  }, [filteredScores, filteredGameRecords]);

  // Format duration into Thai string
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

  // DAILY SCORE TREND AGGREGATION (RECHARTS)
  const dailyTrendData = useMemo(() => {
    const getBangkokDateKey = (timestamp: string | Date | number) => {
      const d = parseDateSafely(timestamp);
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const parts = formatter.formatToParts(d);
      const year = parts.find((p) => p.type === 'year')?.value || '2026';
      const month = parts.find((p) => p.type === 'month')?.value || '01';
      const day = parts.find((p) => p.type === 'day')?.value || '01';
      const dateKey = `${year}-${month}-${day}`;

      const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const mIdx = parseInt(month, 10) - 1;
      const thaiYear = parseInt(year, 10) + 543;
      const displayDate = `${parseInt(day, 10)} ${monthNames[mIdx] || ''}`;
      const fullDate = `${parseInt(day, 10)} ${monthNames[mIdx] || ''} ${thaiYear}`;

      return { dateKey, displayDate, fullDate };
    };

    const dayMap: Record<
      string,
      {
        dateKey: string;
        displayDate: string;
        fullDate: string;
        quizScores: number[];
        gameAccuracies: number[];
        allPercentages: number[];
        quizCount: number;
        gameCount: number;
        usernames: Set<string>;
      }
    > = {};

    filteredScores.forEach((s) => {
      const { dateKey, displayDate, fullDate } = getBangkokDateKey(s.timestamp);
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = {
          dateKey,
          displayDate,
          fullDate,
          quizScores: [],
          gameAccuracies: [],
          allPercentages: [],
          quizCount: 0,
          gameCount: 0,
          usernames: new Set(),
        };
      }
      dayMap[dateKey].quizScores.push(s.percentage);
      dayMap[dateKey].allPercentages.push(s.percentage);
      dayMap[dateKey].quizCount += 1;
      if (s.username) dayMap[dateKey].usernames.add(s.username.toLowerCase());
    });

    filteredGameRecords.forEach((g) => {
      const { dateKey, displayDate, fullDate } = getBangkokDateKey(g.timestamp);
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = {
          dateKey,
          displayDate,
          fullDate,
          quizScores: [],
          gameAccuracies: [],
          allPercentages: [],
          quizCount: 0,
          gameCount: 0,
          usernames: new Set(),
        };
      }
      dayMap[dateKey].gameAccuracies.push(g.accuracyPercentage);
      dayMap[dateKey].allPercentages.push(g.accuracyPercentage);
      dayMap[dateKey].gameCount += 1;
      if (g.username) dayMap[dateKey].usernames.add(g.username.toLowerCase());
    });

    let sortedDays = Object.keys(dayMap)
      .sort()
      .map((key) => {
        const item = dayMap[key];
        const avgQuiz =
          item.quizScores.length > 0
            ? Math.round(item.quizScores.reduce((a, b) => a + b, 0) / item.quizScores.length)
            : null;
        const avgGame =
          item.gameAccuracies.length > 0
            ? Math.round(item.gameAccuracies.reduce((a, b) => a + b, 0) / item.gameAccuracies.length)
            : null;
        const overall =
          item.allPercentages.length > 0
            ? Math.round(item.allPercentages.reduce((a, b) => a + b, 0) / item.allPercentages.length)
            : 0;

        return {
          dateKey: item.dateKey,
          displayDate: item.displayDate,
          fullDate: item.fullDate,
          quizAccuracy: avgQuiz,
          gameAccuracy: avgGame,
          overallAccuracy: overall,
          quizCount: item.quizCount,
          gameCount: item.gameCount,
          totalActivities: item.quizCount + item.gameCount,
          activeStudents: item.usernames.size,
        };
      });

    if (trendWindow === '7D') {
      sortedDays = sortedDays.slice(-7);
    } else if (trendWindow === '14D') {
      sortedDays = sortedDays.slice(-14);
    } else if (trendWindow === '30D') {
      sortedDays = sortedDays.slice(-30);
    }

    return sortedDays;
  }, [filteredScores, filteredGameRecords, trendWindow]);

  // Summary Metrics of the selected Trend Period
  const trendSummary = useMemo(() => {
    if (dailyTrendData.length === 0) {
      return {
        latestAccuracy: null,
        changeDiff: null,
        periodAverage: 0,
        peakDay: null as { date: string; accuracy: number } | null,
        totalActivities: 0,
        activeDaysCount: 0,
      };
    }

    const latest = dailyTrendData[dailyTrendData.length - 1];
    const prev = dailyTrendData.length >= 2 ? dailyTrendData[dailyTrendData.length - 2] : null;
    const changeDiff = prev !== null ? latest.overallAccuracy - prev.overallAccuracy : null;

    let sum = 0;
    let totalActs = 0;
    let peak = dailyTrendData[0];

    dailyTrendData.forEach((d) => {
      sum += d.overallAccuracy;
      totalActs += d.totalActivities;
      if (d.overallAccuracy > peak.overallAccuracy) {
        peak = d;
      }
    });

    const periodAverage = Math.round(sum / dailyTrendData.length);

    return {
      latestAccuracy: latest.overallAccuracy,
      changeDiff,
      periodAverage,
      peakDay: {
        date: peak.displayDate,
        accuracy: peak.overallAccuracy,
      },
      totalActivities: totalActs,
      activeDaysCount: dailyTrendData.length,
    };
  }, [dailyTrendData]);

  // Recharts Custom Tooltip
  const renderTrendTooltip = (props: any) => {
    const { active, payload } = props;
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-2 min-w-[220px] z-50">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <span className="font-bold text-slate-800 dark:text-white">{data.fullDate}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
            {data.activeStudents} ผู้เรียน
          </span>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">ความแม่นยำรวม:</span>
            </div>
            <span className="font-black font-mono text-indigo-600 dark:text-indigo-400 text-sm">
              {data.overallAccuracy}%
            </span>
          </div>

          {data.quizAccuracy !== null && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">แบบฝึกหัด:</span>
              </div>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                {data.quizAccuracy}% ({data.quizCount} ครั้ง)
              </span>
            </div>
          )}

          {data.gameAccuracy !== null && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">เกมคณิตศาสตร์:</span>
              </div>
              <span className="font-mono text-violet-600 dark:text-violet-400 font-bold">
                {data.gameAccuracy}% ({data.gameCount} ครั้ง)
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            <span>กิจกรรมทั้งหมดที่ทำ:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {data.totalActivities} ครั้ง
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Main Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 border border-indigo-700/50 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-amber-300 text-xs font-bold mb-2">
              <BarChart3 className="w-4 h-4" />
              <span>ศูนย์วิเคราะห์และสถิติข้อมูลการเรียนรู้ (Analytics & Diagnostics)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              ระบบวิเคราะห์พัฒนาการ & ตรวจสอบการเรียนรู้
            </h2>
            <p className="text-sm sm:text-base text-indigo-200 mt-2 max-w-2xl leading-relaxed">
              ติดตามสถิติคะแนน ประวัติการเข้าใช้งาน และรายงานวินิจฉัยจุดบกพร่องการคูณ/หารจำนวนเต็ม สำหรับครูและนักเรียน
            </p>
          </div>

          <button
            onClick={loadAllData}
            disabled={isLoading}
            className="self-start md:self-center flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold transition active:scale-95 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'กำลังรีเฟรช...' : 'รีเฟรชข้อมูล'}</span>
          </button>
        </div>

        {/* 2 Main Section Tab Switcher */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-indigo-700/40 pt-4">
          <button
            onClick={() => setActiveMainTab('diagnostic_center')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition shadow-md ${
              activeMainTab === 'diagnostic_center'
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                : 'bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-700/60'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>ศูนย์วิเคราะห์พัฒนาการและวินิจฉัยการเรียนรู้</span>
          </button>

          <button
            onClick={() => setActiveMainTab('scores_history')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition shadow-md ${
              activeMainTab === 'scores_history'
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                : 'bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-700/60'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>คะแนนและประวัติการเข้าใช้งาน</span>
          </button>
        </div>
      </div>

      {/* 4-Dimensional Scope Filter Bar (ภาพรวม / ระดับชั้น / ห้อง / รายบุคคล) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>ขอบเขตข้อมูลที่ต้องการตรวจสอบ (Scope Selector):</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            {[
              { id: 'ALL', label: 'ภาพรวมทั้งหมด', icon: Building },
              { id: 'GRADE', label: 'ระดับชั้น', icon: GraduationCap },
              { id: 'ROOM', label: 'ห้องเรียน', icon: Users },
              { id: 'INDIVIDUAL', label: 'รายบุคคล', icon: UserIcon },
            ].map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.id}
                  onClick={() => {
                    setScope(btn.id as ScopeFilter);
                    if (btn.id === 'ALL') {
                      setSelectedGrade('ALL');
                      setSelectedRoom('ALL');
                      setSelectedUsername('ALL');
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    scope === btn.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{btn.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Filters depending on scope */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* 1. ALL scope */}
          {scope === 'ALL' && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-1">
              <Building className="w-4 h-4 text-indigo-500" />
              <span>แสดงข้อมูลสถิติภาพรวมของผู้เรียนทุกคน ทุกระดับชั้น ทุกห้องเรียน</span>
            </div>
          )}

          {/* 2. GRADE scope */}
          {scope === 'GRADE' && (
            <div className="max-w-md">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                เลือกระดับชั้น:
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">ทุกระดับชั้น (All Grades)</option>
                {availableGrades.map((g) => (
                  <option key={g} value={g}>
                    ชั้น มัธยมศึกษาปีที่ {g}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3. ROOM scope: Show Grade dropdown + Room dropdown + Student in Room dropdown */}
          {scope === 'ROOM' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  1. เลือกระดับชั้น:
                </label>
                <select
                  value={selectedGrade}
                  onChange={(e) => {
                    setSelectedGrade(e.target.value);
                    setSelectedRoom('ALL');
                    setSelectedUsername('ALL');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">ทุกระดับชั้น</option>
                  {availableGrades.map((g) => (
                    <option key={g} value={g}>
                      ชั้น มัธยมศึกษาปีที่ {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  2. เลือกห้องเรียน:
                </label>
                <select
                  value={selectedRoom}
                  onChange={(e) => {
                    setSelectedRoom(e.target.value);
                    setSelectedUsername('ALL');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">ทุกห้องในระดับชั้น</option>
                  {availableRooms.map((r) => (
                    <option key={r} value={r}>
                      ห้อง {selectedGrade !== 'ALL' ? `${selectedGrade}/${r}` : r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  3. รายชื่อนักเรียนในห้อง (Dropdown):
                </label>
                <select
                  value={selectedUsername}
                  onChange={(e) => setSelectedUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">-- แสดงนักเรียนทุกคนในห้องนี้ --</option>
                  {allStudents
                    .filter((st) => {
                      if (selectedGrade !== 'ALL' && String(st.grade) !== selectedGrade) return false;
                      if (selectedRoom !== 'ALL' && String(st.room) !== selectedRoom) return false;
                      return true;
                    })
                    .map((st) => (
                      <option key={st.username} value={st.username}>
                        {st.studentNo ? `เลขที่ ${st.studentNo} - ` : ''}{st.fullName} ({st.grade ? `ม.${st.grade}/${st.room || 1}` : `@${st.username}`})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {/* 4. INDIVIDUAL scope: Show ONLY search box */}
          {scope === 'INDIVIDUAL' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                ค้นหารายชื่อนักเรียน / เลขที่ / Username:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="พิมพ์ค้นหาชื่อนักเรียน, นามสกุล, เลขที่ หรือ Username..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: ศูนย์วิเคราะห์พัฒนาการและวินิจฉัยการเรียนรู้ (Diagnostic Center) */}
      {/* ========================================================================= */}
      {activeMainTab === 'diagnostic_center' && (
        <div className="space-y-6 animate-fadeIn">
          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">อัตราความแม่นยำเฉลี่ย</span>
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {diagnostics.avgAccuracy}%
              </div>
              <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                <span>ระดับ: {diagnostics.masteryLevel}</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ผ่านเกณฑ์มาตรฐาน (≥70%)</span>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {diagnostics.passRate}%
              </div>
              <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                จาก {filteredScores.length + filteredGameRecords.length} กิจกรรมการเรียนรู้
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">แนวโน้มพัฒนาการ</span>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {diagnostics.growthTrend}
              </div>
              <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                ประเมินจากความต่อเนื่อง & ความแม่นยำ
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">กลุ่มระดับความสามารถ</span>
                <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
                  <PieChart className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold mt-1">
                <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  🟢 สูง {diagnostics.highMasteryCount}
                </span>
                <span className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  🟡 กลาง {diagnostics.mediumMasteryCount}
                </span>
                <span className="px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                  🔴 ช่วยเหลือ {diagnostics.supportNeededCount}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">จำแนกตามความเชี่ยวชาญรายบุคคล</div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RECHARTS DAILY SCORE TREND LINE CHART (แนวโน้มคะแนนรายวัน & พัฒนาการ) */}
          {/* ========================================================================= */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <span>กราฟวิเคราะห์แนวโน้มคะแนนและพัฒนาการรายวัน (Daily Score Trend)</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        Recharts
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      แสดงแนวโน้มความแม่นยำและการทำแบบฝึกหัด/เกมคณิตศาสตร์ในแต่ละวัน เทียบกับเกณฑ์มาตรฐาน 70%
                    </p>
                  </div>
                </div>
              </div>

              {/* Chart Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Metric Selector */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                  <button
                    onClick={() => setTrendMetric('all')}
                    className={`px-2.5 py-1 rounded-xl transition ${
                      trendMetric === 'all'
                        ? 'bg-indigo-600 text-white shadow-sm font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    onClick={() => setTrendMetric('overall_only')}
                    className={`px-2.5 py-1 rounded-xl transition ${
                      trendMetric === 'overall_only'
                        ? 'bg-indigo-600 text-white shadow-sm font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    ความแม่นยำรวม
                  </button>
                  <button
                    onClick={() => setTrendMetric('quiz_vs_game')}
                    className={`px-2.5 py-1 rounded-xl transition ${
                      trendMetric === 'quiz_vs_game'
                        ? 'bg-indigo-600 text-white shadow-sm font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    แบบฝึกหัด vs เกม
                  </button>
                </div>

                {/* Time Window Selector */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                  {[
                    { id: '7D', label: '7 วัน' },
                    { id: '14D', label: '14 วัน' },
                    { id: '30D', label: '30 วัน' },
                    { id: 'ALL', label: 'ทั้งหมด' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setTrendWindow(w.id as any)}
                      className={`px-2 py-1 rounded-xl transition ${
                        trendWindow === w.id
                          ? 'bg-indigo-600 text-white shadow-sm font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>

                {/* Volume bar toggle */}
                <button
                  onClick={() => setShowVolumeBars((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-semibold transition ${
                    showVolumeBars
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                  title="เปิด/ปิด การแสดงแท่งจำนวนกิจกรรมรายวัน"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{showVolumeBars ? 'แท่งกิจกรรม: เปิด' : 'แท่งกิจกรรม: ปิด'}</span>
                </button>
              </div>
            </div>

            {/* 4 Mini Insight Summary Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 font-semibold mb-0.5">คะแนนวันล่าสุด</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {trendSummary.latestAccuracy !== null ? `${trendSummary.latestAccuracy}%` : '-'}
                  </span>
                  {trendSummary.changeDiff !== null && (
                    <span
                      className={`text-[11px] font-bold ${
                        trendSummary.changeDiff > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : trendSummary.changeDiff < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {trendSummary.changeDiff > 0 ? `+${trendSummary.changeDiff}%` : `${trendSummary.changeDiff}%`}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 font-semibold mb-0.5">คะแนนเฉลี่ยช่วงนี้</div>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  {trendSummary.periodAverage}%
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 font-semibold mb-0.5">วันที่คะแนนสูงสุด (Peak)</div>
                <div className="text-xl font-black text-amber-500 font-mono">
                  {trendSummary.peakDay ? `${trendSummary.peakDay.accuracy}%` : '-'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {trendSummary.peakDay ? trendSummary.peakDay.date : ''}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 font-semibold mb-0.5">กิจกรรมสะสมทั้งหมด</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {trendSummary.totalActivities} ครั้ง
                </div>
                <div className="text-[10px] text-slate-400">
                  ใน {trendSummary.activeDaysCount} วันที่มีการเรียนรู้
                </div>
              </div>
            </div>

            {/* Recharts Canvas */}
            {dailyTrendData.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p>ยังไม่มีบันทึกข้อมูลคะแนนในขอบเขตหรือช่วงเวลาที่เลือก</p>
                <p className="text-[11px] text-slate-400 mt-1">เมื่อผู้เรียนทำแบบฝึกหัดหรือเล่นเกมคณิตศาสตร์ กราฟจะแสดงผลอัตโนมัติ</p>
              </div>
            ) : (
              <div className="w-full h-80 sm:h-96 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={dailyTrendData}
                    margin={{ top: 20, right: 15, left: -15, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#94a3b8"
                      opacity={0.2}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="displayDate"
                      stroke="#64748b"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      yAxisId="left"
                      domain={[0, 100]}
                      unit="%"
                      stroke="#6366f1"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      allowDecimals={false}
                      stroke="#10b981"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip content={renderTrendTooltip} />
                    <Legend
                      wrapperStyle={{
                        paddingTop: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    />

                    {/* Standard passing threshold benchmark at 70% */}
                    <ReferenceLine
                      yAxisId="left"
                      y={70}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: 'เกณฑ์มาตรฐานผ่าน (70%)',
                        fill: '#ef4444',
                        fontSize: 10,
                        position: 'insideTopRight',
                        fontWeight: 'bold',
                      }}
                    />

                    {/* Activity Volume Bars on secondary right Y-axis */}
                    {showVolumeBars && (
                      <Bar
                        yAxisId="right"
                        dataKey="totalActivities"
                        name="จำนวนกิจกรรม (ครั้ง)"
                        fill="#818cf8"
                        opacity={0.25}
                        barSize={20}
                        radius={[4, 4, 0, 0]}
                      />
                    )}

                    {/* Line 1: Overall Accuracy (Main Curve) */}
                    {(trendMetric === 'all' || trendMetric === 'overall_only') && (
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="overallAccuracy"
                        name="ความแม่นยำรวม (%)"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                        activeDot={{ r: 7, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
                      />
                    )}

                    {/* Line 2: Quiz Accuracy */}
                    {(trendMetric === 'all' || trendMetric === 'quiz_vs_game') && (
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="quizAccuracy"
                        name="คะแนนแบบฝึกหัด (%)"
                        stroke="#0284c7"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 3, fill: '#0284c7' }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    )}

                    {/* Line 3: Game Accuracy */}
                    {(trendMetric === 'all' || trendMetric === 'quiz_vs_game') && (
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="gameAccuracy"
                        name="ความแม่นยำเกม (%)"
                        stroke="#9333ea"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 3, fill: '#9333ea' }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Skill Diagnostic Breakdown & Misconception Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Skill Mastery Diagnostic Bars */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    ผลการวินิจฉัยจำแนกรายทักษะ (Skill Diagnostics)
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-mono">ความแม่นยำ (%)</span>
              </div>

              {/* Multiplication Skill */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">
                    1. ทักษะการคูณจำนวนเต็ม (+ × +, + × -, - × -)
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                    {diagnostics.skillBreakdown.multiplication.accuracy}% ({diagnostics.skillBreakdown.multiplication.status})
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${diagnostics.skillBreakdown.multiplication.accuracy}%` }}
                  />
                </div>
              </div>

              {/* Division Skill */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">
                    2. ทักษะการหารจำนวนเต็ม (+ ÷ +, - ÷ -, + ÷ -)
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                    {diagnostics.skillBreakdown.division.accuracy}% ({diagnostics.skillBreakdown.division.status})
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                    style={{ width: `${diagnostics.skillBreakdown.division.accuracy}%` }}
                  />
                </div>
              </div>

              {/* Mixed / Speed Skill */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">
                    3. ทักษะการคิดคำนวณแบบผสม & ความคล่องแคล่ว (Fluency)
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono">
                    {diagnostics.skillBreakdown.mixed.accuracy}% ({diagnostics.skillBreakdown.mixed.status})
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${diagnostics.skillBreakdown.mixed.accuracy}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Automated Misconception Insights & Pedagogical Recommendations */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  การวินิจฉัยจุดบกพร่องและข้อเสนอแนะเชิงพัฒนาการ
                </h3>
              </div>

              {/* Misconceptions detected */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
                  ⚠️ จุดบกพร่อง / ความเข้าใจคลาดเคลื่อนที่ตรวจพบ:
                </span>
                {diagnostics.misconceptions.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 leading-relaxed flex items-start gap-2"
                  >
                    <span className="font-bold">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                  💡 ข้อเสนอแนะเพื่อยกระดับพัฒนาการ (Actionable Guidance):
                </span>
                {diagnostics.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed flex items-start gap-2"
                  >
                    <span className="font-bold">✓</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Student Diagnostic Matrix Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  ตารางวินิจฉัยพัฒนาการนักเรียนรายบุคคล (Student Development Matrix)
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                แสดงผล <strong className="text-slate-800 dark:text-slate-200">{paginatedStudents.length}</strong> จากทั้งหมด {filteredStudents.length} รายการ (เสนอ 10 รายการต่อหน้า) | หน้า {matrixPage} / {totalMatrixPages}
              </span>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                ไม่พบข้อมูลนักเรียนในขอบเขตที่เลือก
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold bg-slate-50 dark:bg-slate-800/50">
                        <th className="py-3 px-3">ลำดับ</th>
                        <th className="py-3 px-3">นักเรียน</th>
                        <th className="py-3 px-3">ระดับชั้น / ห้อง</th>
                        <th className="py-3 px-3 text-center">แบบฝึกหัด (ครั้ง)</th>
                        <th className="py-3 px-3 text-center">เล่นเกม (ครั้ง)</th>
                        <th className="py-3 px-3 text-center">ความแม่นยำเฉลี่ย</th>
                        <th className="py-3 px-3 text-center">สถานะพัฒนาการ</th>
                        <th className="py-3 px-3 text-center">การดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paginatedStudents.map((st, idx) => {
                        const userQuiz = scores.filter((s) => s.username.toLowerCase() === st.username.toLowerCase());
                        const userGames = gameRecords.filter((g) => g.username.toLowerCase() === st.username.toLowerCase());
                        const totalActs = userQuiz.length + userGames.length;

                        let avg = 0;
                        if (totalActs > 0) {
                          const sum =
                            userQuiz.reduce((a, b) => a + b.percentage, 0) +
                            userGames.reduce((a, b) => a + b.accuracyPercentage, 0);
                          avg = Math.round(sum / totalActs);
                        }

                        return (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <td className="py-3 px-3 font-mono text-slate-400">{(matrixPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                            <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                              <div>{st.fullName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">@{st.username}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                              {st.grade ? `ม.${st.grade}/${st.room || 1} เลขที่ ${st.studentNo || '-'}` : '-'}
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                              {userQuiz.length}
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-violet-600 dark:text-violet-400 font-bold">
                              {userGames.length}
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-black text-slate-900 dark:text-white">
                              {totalActs > 0 ? `${avg}%` : '-'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {totalActs === 0 ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  ยังไม่มีข้อมูล
                                </span>
                              ) : avg >= 80 ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                  🟢 เชี่ยวชาญขั้นสูง
                                </span>
                              ) : avg >= 60 ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                  🟡 กำลังพัฒนา
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                                  🔴 ควรส่งเสริมเร่งด่วน
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => {
                                  setScope('INDIVIDUAL');
                                  setSelectedUsername(st.username);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 text-[11px] font-bold transition flex items-center gap-1 mx-auto"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>เจาะลึก</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls for Student Matrix */}
                {totalMatrixPages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setMatrixPage((prev) => Math.max(1, prev - 1))}
                      disabled={matrixPage === 1}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>ก่อนหน้า</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalMatrixPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalMatrixPages > 5 && matrixPage > 3) {
                          pageNum = Math.min(totalMatrixPages - 4 + i, Math.max(1, matrixPage - 2 + i));
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setMatrixPage(pageNum)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                              matrixPage === pageNum
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
                      onClick={() => setMatrixPage((prev) => Math.min(totalMatrixPages, prev + 1))}
                      disabled={matrixPage === totalMatrixPages}
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

      {/* ========================================================================= */}
      {/* SECTION 2: คะแนนและประวัติการเข้าใช้งาน (Scores & Access History / Logs) */}
      {/* ========================================================================= */}
      {activeMainTab === 'scores_history' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Sub Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setScoresSubTab('scores')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition ${
                  scoresSubTab === 'scores'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>คะแนนแบบฝึกหัด ({filteredScores.length})</span>
              </button>

              <button
                onClick={() => setScoresSubTab('games')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition ${
                  scoresSubTab === 'games'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Gamepad2 className="w-4 h-4" />
                <span>คะแนนเกมคณิตศาสตร์ ({filteredGameRecords.length})</span>
              </button>

              <button
                onClick={() => setScoresSubTab('sessions')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition ${
                  scoresSubTab === 'sessions'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>สรุปเวลาเรียนสะสม ({filteredSessions.length})</span>
              </button>

              <button
                onClick={() => setScoresSubTab('logs')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition ${
                  scoresSubTab === 'logs'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>ประวัติ Sign In / Out ({filteredLogs.length})</span>
              </button>
            </div>
          </div>

          {/* Sub-view 1: Quiz Scores Board */}
          {scoresSubTab === 'scores' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span>ตารางคะแนนและสถิติแบบฝึกหัดคณิตศาสตร์</span>
                </h3>

                {/* Specific Quiz Operation Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                    กรองตามหัวข้อ:
                  </label>
                  <select
                    value={selectedQuizOp}
                    onChange={(e) => setSelectedQuizOp(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">ทุกหัวข้อแบบฝึกหัด</option>
                    <option value="multiplication">การคูณจำนวนเต็ม (+ × +, + × -, - × -)</option>
                    <option value="division">การหารจำนวนเต็ม (+ ÷ +, - ÷ -, + ÷ -)</option>
                    <option value="mixed">แบบฝึกหัดผสมคูณและหาร</option>
                  </select>
                </div>
              </div>

              {/* Quiz Quick Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40">
                  <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">จำนวนครั้งที่ทำ</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">{filteredScores.length} ครั้ง</div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">ความแม่นยำเฉลี่ย</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {filteredScores.length > 0
                      ? Math.round(filteredScores.reduce((a, b) => a + b.percentage, 0) / filteredScores.length)
                      : 0}%
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40">
                  <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">คะแนนเต็ม 100%</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {filteredScores.filter((s) => s.percentage === 100).length} ครั้ง
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-violet-50/60 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/40">
                  <div className="text-[11px] font-bold text-violet-600 dark:text-violet-400">ผ่านเกณฑ์ (≥70%)</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {filteredScores.length > 0
                      ? Math.round((filteredScores.filter((s) => s.percentage >= 70).length / filteredScores.length) * 100)
                      : 0}%
                  </div>
                </div>
              </div>

              {filteredScores.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  ไม่พบข้อมูลคะแนนแบบฝึกหัดในขอบเขตหรือหัวข้อที่เลือก
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>
                      แสดงผล <strong className="text-slate-800 dark:text-slate-200">{paginatedScores.length}</strong> จากทั้งหมด {filteredScores.length} รายการ (เสนอ 10 รายการต่อหน้า)
                    </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      หน้า {quizPage} / {totalQuizPages}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold bg-slate-50 dark:bg-slate-800/50">
                          <th className="py-3 px-3">อันดับ</th>
                          <th className="py-3 px-3">ผู้เรียน</th>
                          <th className="py-3 px-3">ระดับชั้น / ห้อง</th>
                          <th className="py-3 px-3">เรื่อง</th>
                          <th className="py-3 px-3 text-center">คะแนน</th>
                          <th className="py-3 px-3 text-center">ความแม่นยำ</th>
                          <th className="py-3 px-3">เวลาที่บันทึก</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {paginatedScores.map((s, idx) => (
                          <tr key={s.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <td className="py-3 px-3 font-mono font-bold text-slate-500">#{(quizPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                            <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                              <div>{s.fullName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">@{s.username}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                              {s.grade ? `ม.${s.grade}/${s.room || 1} เลขที่ ${s.studentNo || '-'}` : '-'}
                            </td>
                            <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{s.details || s.operation}</td>
                            <td className="py-3 px-3 text-center font-mono font-black text-indigo-600 dark:text-indigo-400">
                              {s.score} / {s.totalQuestions}
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-black">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs ${
                                  s.percentage >= 80
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : s.percentage >= 60
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}
                              >
                                {s.percentage}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                              {formatThaiDateTime(s.timestamp)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination for Quiz Scores */}
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
          )}

          {/* Sub-view 2: Game Records Board */}
          {scoresSubTab === 'games' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-indigo-500" />
                  <span>ตารางคะแนนและสถิติเกมคณิตศาสตร์</span>
                </h3>

                {/* Specific Game Selector Filter (15 Games) */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                    เลือกเกม (15 เกม):
                  </label>
                  <select
                    value={selectedGameId}
                    onChange={(e) => setSelectedGameId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">🎮 รวมทั้ง 15 เกมคณิตศาสตร์</option>
                    <option value="game-1">1. Speed Run ผจญภัยดินแดนตัวเลข</option>
                    <option value="game-2">2. Bubble Pop สอยฟองสบู่จำนวนเต็ม</option>
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
                    <option value="game-14">14. Neon Matrix แมทริกซ์นีออนความเร็วแสง</option>
                    <option value="game-15">15. Deep Sea Odyssey ดำดิ่งก้นทะเลล่าสมบัติ</option>
                  </select>
                </div>
              </div>

              {/* Game Quick Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40">
                  <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">รอบที่เล่นทั้งหมด</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">{filteredGameRecords.length} รอบ</div>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40">
                  <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">คะแนนสูงสุด (High Score)</div>
                  <div className="text-xl font-black text-amber-500">
                    {filteredGameRecords.length > 0
                      ? Math.max(...filteredGameRecords.map((g) => g.score)).toLocaleString()
                      : 0}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-violet-50/60 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/40">
                  <div className="text-[11px] font-bold text-violet-600 dark:text-violet-400">คอมโบสูงสุด</div>
                  <div className="text-xl font-black text-violet-500">
                    {filteredGameRecords.length > 0
                      ? `${Math.max(...filteredGameRecords.map((g) => g.maxCombo || 0))}x`
                      : '-'}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">ความแม่นยำเฉลี่ย</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {filteredGameRecords.length > 0
                      ? Math.round(filteredGameRecords.reduce((a, b) => a + b.accuracyPercentage, 0) / filteredGameRecords.length)
                      : 0}%
                  </div>
                </div>
              </div>

              {filteredGameRecords.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  ไม่พบข้อมูลบันทึกเกมในขอบเขตหรือเกมที่เลือก
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>
                      แสดงผล <strong className="text-slate-800 dark:text-slate-200">{paginatedGames.length}</strong> จากทั้งหมด {filteredGameRecords.length} รายการ (เสนอ 10 รายการต่อหน้า)
                    </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      หน้า {gamePage} / {totalGamePages}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold bg-slate-50 dark:bg-slate-800/50">
                          <th className="py-3 px-3">ผู้เล่น</th>
                          <th className="py-3 px-3">ชื่อเกม</th>
                          <th className="py-3 px-3 text-center">คะแนนสะสม</th>
                          <th className="py-3 px-3 text-center">คอมโบสูงสุด</th>
                          <th className="py-3 px-3 text-center">ความแม่นยำ</th>
                          <th className="py-3 px-3">รายละเอียดผลลัพธ์</th>
                          <th className="py-3 px-3">เวลาที่เล่น</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {paginatedGames.map((g, idx) => (
                          <tr key={g.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                              <div>{g.fullName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {g.grade ? `ม.${g.grade}/${g.room || 1} เลขที่ ${g.studentNo || '-'}` : `@${g.username}`}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                              {g.gameTitle}
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-black text-amber-500">
                              {g.score.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-violet-500">
                              {g.maxCombo ? `${g.maxCombo}x` : '-'}
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600">
                              {g.accuracyPercentage}%
                            </td>
                            <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{g.details}</td>
                            <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                              {formatThaiDateTime(g.timestamp)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination for Game Records */}
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
          )}

          {/* Sub-view 3: Session Summaries */}
          {scoresSubTab === 'sessions' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-500" />
                <span>สรุปเวลาเรียนสะสมและสถานะออนไลน์</span>
              </h3>

              {filteredSessions.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  ไม่พบข้อมูลเวลาการใช้งานในขอบเขตที่เลือก
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>
                      แสดงผล <strong className="text-slate-800 dark:text-slate-200">{paginatedSessions.length}</strong> จากทั้งหมด {filteredSessions.length} รายการ (เสนอ 10 รายการต่อหน้า)
                    </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      หน้า {sessionPage} / {totalSessionPages}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold bg-slate-50 dark:bg-slate-800/50">
                          <th className="py-3 px-3">ลำดับ</th>
                          <th className="py-3 px-3">ผู้เรียน</th>
                          <th className="py-3 px-3 text-center">สถานะ</th>
                          <th className="py-3 px-3 text-center">จำนวนเซสชัน</th>
                          <th className="py-3 px-3 text-center">เวลาใช้งานรวม</th>
                          <th className="py-3 px-3">เข้าสู่ระบบล่าสุด</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {paginatedSessions.map((sess, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <td className="py-3 px-3 font-mono text-slate-400">{(sessionPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                            <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                              <div>{sess.fullName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">@{sess.username}</div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {sess.isOnline ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                  <span>กำลังใช้งาน</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  ออฟไลน์
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {sess.totalSessions} ครั้ง
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-black text-slate-900 dark:text-white">
                              {formatDuration(sess.totalDurationSeconds + (sess.activeDurationSeconds || 0))}
                            </td>
                            <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                              {formatThaiDateTime(sess.lastSignIn)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination for Session Summaries */}
                  {totalSessionPages > 1 && (
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setSessionPage((prev) => Math.max(1, prev - 1))}
                        disabled={sessionPage === 1}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>ก่อนหน้า</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalSessionPages) }, (_, i) => {
                          let pageNum = i + 1;
                          if (totalSessionPages > 5 && sessionPage > 3) {
                            pageNum = Math.min(totalSessionPages - 4 + i, Math.max(1, sessionPage - 2 + i));
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setSessionPage(pageNum)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                                sessionPage === pageNum
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
                        onClick={() => setSessionPage((prev) => Math.min(totalSessionPages, prev + 1))}
                        disabled={sessionPage === totalSessionPages}
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
          )}

          {/* Sub-view 4: Raw Logs */}
          {scoresSubTab === 'logs' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-500" />
                <span>บันทึกประวัติการเข้าและออกจากระบบ (Sign In / Sign Out Audit Logs)</span>
              </h3>

              {filteredLogs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  ไม่พบบันทึก Log ในขอบเขตที่เลือก
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>
                      แสดงผล <strong className="text-slate-800 dark:text-slate-200">{paginatedLogs.length}</strong> จากทั้งหมด {filteredLogs.length} รายการ (เสนอ 10 รายการต่อหน้า)
                    </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      หน้า {logPage} / {totalLogPages}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold bg-slate-50 dark:bg-slate-800/50">
                          <th className="py-3 px-3">ลำดับ</th>
                          <th className="py-3 px-3">ผู้ใช้งาน</th>
                          <th className="py-3 px-3">กิจกรรม</th>
                          <th className="py-3 px-3">อุปกรณ์ / เบราว์เซอร์</th>
                          <th className="py-3 px-3">เวลาที่เกิดกิจกรรม</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {paginatedLogs.map((log, idx) => (
                          <tr key={log.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <td className="py-3 px-3 font-mono text-slate-400">{(logPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                            <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                              <div>{log.fullName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">@{log.username}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  log.action === 'SIGN_IN'
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                }`}
                              >
                                {log.action === 'SIGN_IN' ? 'เข้าสู่ระบบ (Sign In)' : 'ออกจากระบบ (Sign Out)'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-500">{log.device || 'Web Client'}</td>
                            <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                              {formatThaiDateTime(log.timestamp)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination for Logs */}
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
          )}
        </div>
      )}
    </div>
  );
};
