import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Clock,
  User,
  Filter,
  Search,
  CheckCircle2,
  Activity,
  History,
  Smartphone,
  RefreshCw,
  Zap,
  Gamepad2,
  Flame,
  Award,
  Sparkles,
} from 'lucide-react';
import { ScoreRecord, UserLog, SessionSummary, GameRecord } from '../types';
import { supabaseService } from '../services/supabaseService';
import { formatThaiDateTime } from '../utils/dateUtils';

export const LeaderboardAndLogs: React.FC = () => {
  const [mainTab, setMainTab] = useState<'scores' | 'games' | 'sessions' | 'rawLogs'>('scores');

  // Scores State
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [scoresLoading, setScoresLoading] = useState<boolean>(true);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [selectedOpFilter, setSelectedOpFilter] = useState<string>('ALL');

  // Detailed Game Records State
  const [gameRecords, setGameRecords] = useState<GameRecord[]>([]);
  const [gamesLoading, setGamesLoading] = useState<boolean>(true);
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>('ALL');

  // Logs & Sessions State
  const [userLogs, setUserLogs] = useState<UserLog[]>([]);
  const [sessionSummaries, setSessionSummaries] = useState<SessionSummary[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setScoresLoading(true);
    setGamesLoading(true);
    setLogsLoading(true);

    try {
      const fetchedScores = await supabaseService.fetchScores();
      setScores(fetchedScores);

      const fetchedGames = await supabaseService.fetchGameRecords();
      setGameRecords(fetchedGames);

      const fetchedLogs = await supabaseService.fetchUserLogs();
      setUserLogs(fetchedLogs);

      const summaries = supabaseService.calculateSessionSummaries(fetchedLogs);
      setSessionSummaries(summaries);
    } catch (err) {
      console.warn('Error loading data:', err);
    } finally {
      setScoresLoading(false);
      setGamesLoading(false);
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format seconds into readable Thai duration string e.g. "15 นาที 30 วินาที" or "1 ชม. 10 นาที"
  const formatDuration = (totalSecs: number) => {
    if (totalSecs <= 0) return '0 วินาที';
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} ชม.`);
    if (mins > 0) parts.push(`${mins} นาที`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs} วินาที`);

    return parts.join(' ');
  };

  // Unique list of usernames for dropdown filter
  const uniqueUsernames = Array.from(new Set(scores.map((s) => s.username)));

  // Filtered & sorted scores
  const filteredScores = scores
    .filter((s) => {
      if (selectedUserFilter !== 'ALL' && s.username.toLowerCase() !== selectedUserFilter.toLowerCase()) {
        return false;
      }
      if (selectedOpFilter !== 'ALL' && s.operation !== selectedOpFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.percentage - a.percentage || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-800 to-violet-800 text-white shadow-xl flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-amber-300 font-bold text-xs uppercase tracking-wider">
            <Trophy className="w-4 h-4" /> สถิติ & ประวัติการใช้งาน (Leaderboard & Logs)
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            ตารางคะแนนและระยะเวลาใช้งาน
          </h2>
          <p className="text-indigo-200 text-xs mt-1">
            เรียงลำดับคะแนน ซิงค์ข้อมูลลงฐานข้อมูล Supabase และติดตามเวลา Sign In / Sign Out
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" /> รีเฟรชข้อมูล
        </button>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setMainTab('scores')}
          className={`pb-3 px-4 font-bold text-sm transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            mainTab === 'scores'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>ตารางคะแนนแบบฝึกหัด</span>
        </button>

        <button
          onClick={() => setMainTab('games')}
          className={`pb-3 px-4 font-bold text-sm transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            mainTab === 'games'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>ผลเกมคณิตศาสตร์ละเอียด ({gameRecords.length})</span>
        </button>

        <button
          onClick={() => setMainTab('sessions')}
          className={`pb-3 px-4 font-bold text-sm transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            mainTab === 'sessions'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>สรุประยะเวลาใช้งานรายบุคคล</span>
        </button>

        <button
          onClick={() => setMainTab('rawLogs')}
          className={`pb-3 px-4 font-bold text-sm transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            mainTab === 'rawLogs'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>ประวัติ Sign In / Sign Out</span>
        </button>
      </div>

      {/* 1. SCORE TABLE VIEW */}
      {mainTab === 'scores' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
              <Filter className="w-4 h-4 text-indigo-600" /> ตัวกรองข้อมูล:
            </div>

            <div className="flex flex-wrap gap-3">
              {/* User filter */}
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">ผู้ใช้งานทั้งหมด</option>
                {uniqueUsernames.map((u) => (
                  <option key={u} value={u}>
                    @{u}
                  </option>
                ))}
              </select>

              {/* Operation Filter */}
              <select
                value={selectedOpFilter}
                onChange={(e) => setSelectedOpFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">ประเภททั้งหมด</option>
                <option value="multiplication">การคูณ</option>
                <option value="division">การหาร</option>
                <option value="mixed">ผสม</option>
                <option value="puzzle">โจทย์ทาย</option>
              </select>
            </div>
          </div>

          {/* Scores Table */}
          <div className="p-1 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs sm:text-sm min-w-[550px]">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase text-[11px] sm:text-xs">
                <tr>
                  <th className="p-2.5 sm:p-3.5 text-center whitespace-nowrap">อันดับ</th>
                  <th className="p-2.5 sm:p-3.5 whitespace-nowrap">ผู้ทำแบบฝึกหัด</th>
                  <th className="p-2.5 sm:p-3.5 text-center whitespace-nowrap">ประเภท</th>
                  <th className="p-2.5 sm:p-3.5 text-center whitespace-nowrap">ระดับ</th>
                  <th className="p-2.5 sm:p-3.5 text-center whitespace-nowrap">คะแนน</th>
                  <th className="p-2.5 sm:p-3.5 text-center whitespace-nowrap">ร้อยละ (%)</th>
                  <th className="p-2.5 sm:p-3.5 text-right whitespace-nowrap">วัน-เวลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredScores.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      ไม่พบประวัติผลคะแนนตามตัวกรองที่เลือก
                    </td>
                  </tr>
                ) : (
                  filteredScores.map((s, idx) => (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="p-2.5 sm:p-3.5 text-center font-bold whitespace-nowrap">
                        {idx === 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-extrabold text-xs">
                            🥇 1
                          </span>
                        ) : idx === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-extrabold text-xs">
                            🥈 2
                          </span>
                        ) : idx === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-800/20 text-amber-800 font-extrabold text-xs">
                            🥉 3
                          </span>
                        ) : (
                          idx + 1
                        )}
                      </td>
                      <td className="p-2.5 sm:p-3.5 whitespace-nowrap">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block truncate max-w-[140px] sm:max-w-none">
                          {s.fullName}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          {s.grade && s.room ? (
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                              ชั้น {s.grade}/{s.room} {s.studentNo ? `เลขที่ ${s.studentNo}` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400">@{s.username}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-2.5 sm:p-3.5 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold whitespace-nowrap inline-block">
                          {s.operation === 'multiplication'
                            ? 'การคูณ'
                            : s.operation === 'division'
                            ? 'การหาร'
                            : s.operation === 'mixed'
                            ? 'ผสม'
                            : 'โจทย์ทาย'}
                        </span>
                      </td>
                      <td className="p-2.5 sm:p-3.5 text-center text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">
                        {s.difficulty === 'easy'
                          ? 'ง่าย'
                          : s.difficulty === 'medium'
                          ? 'ปานกลาง'
                          : 'ยาก (มีวงเล็บ)'}
                      </td>
                      <td className="p-2.5 sm:p-3.5 text-center font-mono font-bold whitespace-nowrap">
                        {s.score} / {s.totalQuestions}
                      </td>
                      <td className="p-2.5 sm:p-3.5 text-center font-mono font-extrabold text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm whitespace-nowrap">
                        {s.percentage}%
                      </td>
                      <td className="p-2.5 sm:p-3.5 text-right text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap font-mono">
                        {formatThaiDateTime(s.timestamp, {
                          dateStyle: 'short',
                          showSeconds: true,
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. DETAILED GAME RECORDS VIEW */}
      {mainTab === 'games' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
              <Filter className="w-4 h-4 text-indigo-600" /> ตัวกรองข้อมูลเกม:
            </div>

            <div className="flex flex-wrap gap-3">
              {/* User filter */}
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">ผู้เล่นทั้งหมด</option>
                {uniqueUsernames.map((u) => (
                  <option key={u} value={u}>
                    @{u}
                  </option>
                ))}
              </select>

              {/* Game filter */}
              <select
                value={selectedGameFilter}
                onChange={(e) => setSelectedGameFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">เกมทั้งหมด</option>
                {Array.from(new Set(gameRecords.map((g) => g.gameTitle))).map((title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Game Records Table */}
          <div className="p-1 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs sm:text-sm min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase text-[11px] sm:text-xs">
                <tr>
                  <th className="p-2.5 sm:p-3.5 text-center whitespace-nowrap">อันดับ</th>
                  <th className="p-2.5 sm:p-3.5 whitespace-nowrap">ผู้เล่น</th>
                  <th className="p-2.5 sm:p-3.5 whitespace-nowrap">ชื่อเกม</th>
                  <th className="p-2.5 sm:p-3.5 text-center whitespace-nowrap">คะแนนเกม</th>
                  <th className="p-2.5 sm:p-3.5 text-center whitespace-nowrap">ความแม่นยำ</th>
                  <th className="p-2.5 sm:p-3.5 text-center whitespace-nowrap">Combo สูงสุด</th>
                  <th className="p-2.5 sm:p-3.5 text-center whitespace-nowrap">เวลาที่ใช้</th>
                  <th className="p-2.5 sm:p-3.5 whitespace-nowrap">รายละเอียดผลลัพธ์</th>
                  <th className="p-2.5 sm:p-3.5 text-right whitespace-nowrap">วัน-เวลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {gameRecords
                  .filter((g) => {
                    if (
                      selectedUserFilter !== 'ALL' &&
                      g.username.toLowerCase() !== selectedUserFilter.toLowerCase()
                    ) {
                      return false;
                    }
                    if (selectedGameFilter !== 'ALL' && g.gameTitle !== selectedGameFilter) {
                      return false;
                    }
                    return true;
                  })
                  .sort(
                    (a, b) =>
                      b.score - a.score ||
                      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  ).length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      ยังไม่มีข้อมูลผลเกมคณิตศาสตร์ละเอียดตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  gameRecords
                    .filter((g) => {
                      if (
                        selectedUserFilter !== 'ALL' &&
                        g.username.toLowerCase() !== selectedUserFilter.toLowerCase()
                      ) {
                        return false;
                      }
                      if (selectedGameFilter !== 'ALL' && g.gameTitle !== selectedGameFilter) {
                        return false;
                      }
                      return true;
                    })
                    .sort(
                      (a, b) =>
                        b.score - a.score ||
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    )
                    .map((g, idx) => (
                      <tr
                        key={g.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="p-2.5 sm:p-3.5 text-center font-bold whitespace-nowrap">
                          {idx === 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-extrabold text-xs">
                              🥇
                            </span>
                          ) : idx === 1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-extrabold text-xs">
                              🥈
                            </span>
                          ) : idx === 2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-800 font-extrabold text-xs">
                              🥉
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-xs">{idx + 1}</span>
                          )}
                        </td>
                        <td className="p-2.5 sm:p-3.5 whitespace-nowrap">
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">
                            {g.fullName}
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            {g.grade && g.room ? (
                              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                ชั้น {g.grade}/{g.room} {g.studentNo ? `เลขที่ ${g.studentNo}` : ''}
                              </span>
                            ) : (
                              <span className="text-slate-400">@{g.username}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5 sm:p-3.5 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold inline-flex items-center gap-1">
                            <Gamepad2 className="w-3.5 h-3.5 text-indigo-500" />
                            {g.gameTitle}
                          </span>
                        </td>
                        <td className="p-2.5 sm:p-3.5 text-center font-mono font-black text-amber-600 dark:text-amber-400 text-sm sm:text-base whitespace-nowrap">
                          {g.score.toLocaleString()}
                        </td>
                        <td className="p-2.5 sm:p-3.5 text-center font-mono text-xs whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold ${
                              g.accuracyPercentage >= 80
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : g.accuracyPercentage >= 50
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {g.accuracyPercentage}% ({g.correctCount}/{g.totalQuestions})
                          </span>
                        </td>
                        <td className="p-2.5 sm:p-3.5 text-center font-mono font-bold text-amber-500 text-xs whitespace-nowrap">
                          <span className="inline-flex items-center gap-0.5">
                            <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />x
                            {g.maxCombo}
                          </span>
                        </td>
                        <td className="p-2.5 sm:p-3.5 text-center font-mono text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                          {g.timeSpentSeconds ? `${g.timeSpentSeconds} วินาที` : '-'}
                        </td>
                        <td className="p-2.5 sm:p-3.5 text-slate-600 dark:text-slate-300 text-xs max-w-xs truncate">
                          {g.details || '-'}
                        </td>
                        <td className="p-2.5 sm:p-3.5 text-right text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap font-mono">
                          {formatThaiDateTime(g.timestamp, {
                            dateStyle: 'short',
                            showSeconds: true,
                          })}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SESSION & DURATION TRACKER VIEW */}
      {mainTab === 'sessions' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessionSummaries.map((sess) => (
              <div
                key={sess.username}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3 relative overflow-hidden"
              >
                {/* Active Online Indicator */}
                {sess.isOnline && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>กำลังใช้งานอยู่</span>
                  </div>
                )}

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    {sess.fullName}
                  </h3>
                  <p className="text-xs text-slate-400">@{sess.username}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">จำนวนครั้ง Sign In:</span>
                    <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {sess.totalSessions} ครั้ง
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">เวลารวมที่ใช้ทั้งหมด:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatDuration(sess.totalDurationSeconds + (sess.activeDurationSeconds || 0))}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>เข้าใช้งานล่าสุด:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      {formatThaiDateTime(sess.lastSignIn, {
                        dateStyle: 'short',
                        showSeconds: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. RAW SIGN IN / SIGN OUT LOGS VIEW */}
      {mainTab === 'rawLogs' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-1 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase">
                <tr>
                  <th className="p-3.5">กิจกรรม</th>
                  <th className="p-3.5">ผู้ใช้งาน</th>
                  <th className="p-3.5">อุปกรณ์</th>
                  <th className="p-3.5 text-right">เวลาบันทึก (Timestamp App & Database)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {userLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      ยังไม่มีบันทึกประวัติ Sign In / Sign Out
                    </td>
                  </tr>
                ) : (
                  userLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                            log.action === 'SIGN_IN'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {log.action === 'SIGN_IN' ? '🟢 Sign In (เข้าสู่ระบบ)' : '🔴 Sign Out (ออกจากระบบ)'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          {log.fullName}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          {log.grade && log.room ? (
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                              ชั้น {log.grade}/{log.room} {log.studentNo ? `เลขที่ ${log.studentNo}` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400">@{log.username}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-500 text-xs">
                        {log.device || 'Web Browser'}
                      </td>
                      <td className="p-3.5 text-right text-slate-500 dark:text-slate-300 text-xs font-mono">
                        {formatThaiDateTime(log.timestamp, {
                          dateStyle: 'medium',
                          showSeconds: true,
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
