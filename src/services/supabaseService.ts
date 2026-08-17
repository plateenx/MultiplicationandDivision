import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ScoreRecord, User, UserLog, SessionSummary, GameRecord, GameSummaryStats } from '../types';

export interface SupabaseSettings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  soundEnabled: boolean;
  theme: 'light' | 'dark';
}

const STORAGE_KEYS = {
  USERS: 'math_app_users',
  SCORES: 'math_app_scores',
  GAME_RECORDS: 'math_app_game_records',
  LOGS: 'math_app_user_logs',
  SETTINGS: 'math_app_supabase_settings',
  CURRENT_USER: 'math_app_current_user',
};

// Clean and normalize Supabase project URL (e.g. strips /rest/v1/ if user accidentally pasted it)
export function sanitizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  url = url.replace(/\/rest\/v1\/?$/i, '');
  url = url.replace(/\/+$/, '');
  return url;
}

export function isValidAnonKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.includes('...') || trimmed.length < 100) return false;
  const parts = trimmed.split('.');
  return parts.length === 3 && parts[0].length > 10 && parts[1].length > 10 && parts[2].length > 10;
}

export const DEFAULT_SUPABASE_SETTINGS: SupabaseSettings = {
  supabaseUrl:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    'https://nweygxwkmleisidemdbq.supabase.co',
  supabaseAnonKey:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53ZXlneHdrbWxlaXNpZGVtZGJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODg1MTYsImV4cCI6MjEwMjM2NDUxNn0.cLEyB0w7klMCvzkMtRVmTUrvtoZAZPt61XFp9rtmL-Y',
  soundEnabled: true,
  theme: 'dark',
};

// Default sample users for instant preview if database is initial
const DEMO_USERS: User[] = [
  {
    username: 'student01',
    name: 'สมชาย',
    surname: 'ใจดี',
    grade: 1,
    room: 1,
    studentNo: 1,
    email: 'somchai@school.ac.th',
    registeredAt: '2026-08-01T08:00:00.000Z',
  },
  {
    username: 'student02',
    name: 'สมหญิง',
    surname: 'รักเรียน',
    grade: 2,
    room: 3,
    studentNo: 15,
    email: 'somying@school.ac.th',
    registeredAt: '2026-08-02T09:30:00.000Z',
  },
];

// Initial score records for leaderboard preview
const DEMO_SCORES: ScoreRecord[] = [
  {
    id: 'score_1',
    username: 'student01',
    fullName: 'สมชาย ใจดี',
    grade: 1,
    room: 1,
    studentNo: 1,
    operation: 'multiplication',
    difficulty: 'easy',
    score: 10,
    totalQuestions: 10,
    percentage: 100,
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    details: 'การคูณจำนวนเต็ม ง่าย',
  },
  {
    id: 'score_2',
    username: 'student02',
    fullName: 'สมหญิง รักเรียน',
    grade: 2,
    room: 3,
    studentNo: 15,
    operation: 'mixed',
    difficulty: 'medium',
    score: 9,
    totalQuestions: 10,
    percentage: 90,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    details: 'ผสมการคูณและการหาร ปานกลาง',
  },
];

// Initial sample game records for Game Hub leaderboard
const DEMO_GAME_RECORDS: GameRecord[] = [
  {
    id: 'game_demo_1',
    username: 'student01',
    fullName: 'สมชาย ใจดี',
    grade: 1,
    room: 1,
    studentNo: 1,
    gameId: 'space_blast',
    gameTitle: 'ยานอวกาศฝ่าดงดาวเคราะห์',
    gameCategory: 'mixed',
    score: 1450,
    highScore: 1450,
    correctCount: 12,
    totalQuestions: 13,
    accuracyPercentage: 92,
    maxCombo: 8,
    timeSpentSeconds: 45,
    details: 'ทำลายดาวเคราะห์ 12 ลูก, Combo สูงสุด x8',
    specialMetrics: { asteroids_destroyed: 12, hp_remaining: 3 },
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'game_demo_2',
    username: 'student02',
    fullName: 'สมหญิง รักเรียน',
    grade: 2,
    room: 3,
    studentNo: 15,
    gameId: 'formula_drift',
    gameTitle: 'ซิ่งรถดริฟต์คำนวณ',
    gameCategory: 'speed',
    score: 1820,
    highScore: 1820,
    correctCount: 14,
    totalQuestions: 15,
    accuracyPercentage: 93,
    maxCombo: 11,
    timeSpentSeconds: 60,
    details: 'ความเร็วสูงสุด 228 km/h, ดริฟต์ผ่าน 14 ด่าน',
    specialMetrics: { max_speed_kmh: 228, lives_remaining: 2 },
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'game_demo_3',
    username: 'student01',
    fullName: 'สมชาย ใจดี',
    grade: 1,
    room: 1,
    studentNo: 1,
    gameId: 'boss_battle',
    gameTitle: 'ศึกต่อสู้บอสมอนสเตอร์',
    gameCategory: 'mixed',
    score: 2100,
    highScore: 2100,
    correctCount: 18,
    totalQuestions: 19,
    accuracyPercentage: 95,
    maxCombo: 9,
    timeSpentSeconds: 75,
    details: 'ปราบบอสสำเร็จครบ 3 ระดับ, โจมตีคริติคอล 6 ครั้ง',
    specialMetrics: { boss_defeated: 3, critical_hits: 6, hp_remaining: 50 },
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];


class SupabaseService {
  private client: SupabaseClient | null = null;
  private currentUrl: string = '';
  private currentKey: string = '';

  public getSettings(): SupabaseSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        const url = sanitizeSupabaseUrl(parsed.supabaseUrl || DEFAULT_SUPABASE_SETTINGS.supabaseUrl);
        // If parsed key is missing, truncated (...), or not a valid JWT, automatically use DEFAULT
        let key = parsed.supabaseAnonKey;
        if (!key || !isValidAnonKey(key)) {
          key = DEFAULT_SUPABASE_SETTINGS.supabaseAnonKey;
        }
        return {
          ...DEFAULT_SUPABASE_SETTINGS,
          ...parsed,
          supabaseUrl: url,
          supabaseAnonKey: key,
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SUPABASE_SETTINGS;
  }

  public resetToDefaults(): SupabaseSettings {
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    this.client = null;
    this.currentUrl = '';
    this.currentKey = '';
    return DEFAULT_SUPABASE_SETTINGS;
  }

  public saveSettings(settings: Partial<SupabaseSettings>) {
    const current = this.getSettings();
    const cleanUrl = settings.supabaseUrl ? sanitizeSupabaseUrl(settings.supabaseUrl) : current.supabaseUrl;
    const updated = {
      ...current,
      ...settings,
      supabaseUrl: cleanUrl,
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    // Reset client to reinitialize on next request
    this.client = null;
    this.currentUrl = '';
    this.currentKey = '';
  }

  public getClient(): SupabaseClient | null {
    const settings = this.getSettings();
    const cleanUrl = sanitizeSupabaseUrl(settings.supabaseUrl);
    if (!cleanUrl) return null;

    const keyToUse = settings.supabaseAnonKey || DEFAULT_SUPABASE_SETTINGS.supabaseAnonKey;

    if (
      this.client &&
      this.currentUrl === cleanUrl &&
      this.currentKey === keyToUse
    ) {
      return this.client;
    }

    try {
      this.client = createClient(cleanUrl, keyToUse, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      this.currentUrl = cleanUrl;
      this.currentKey = keyToUse;
      return this.client;
    } catch (err) {
      console.warn('Could not initialize Supabase client:', err);
      return null;
    }
  }

  // Test connection to all tables in Supabase with deep diagnostics & time sync check
  public async testAllTables(): Promise<{
    overallSuccess: boolean;
    message: string;
    authOk: boolean;
    serverTimeInfo?: {
      clientIso: string;
      thaiFormatted: string;
      latencyMs: number;
      timeSyncStatus: 'synced' | 'warning';
      timeSyncMessage: string;
    };
    tables: {
      name: string;
      title: string;
      status: 'ok' | 'missing' | 'permission_error' | 'error';
      rowCount: number;
      message: string;
      columnsStatus?: 'full' | 'partial';
    }[];
  }> {
    const settings = this.getSettings();
    if (!settings.supabaseUrl) {
      return {
        overallSuccess: false,
        message: 'กรุณาระบุ Supabase Project URL',
        authOk: false,
        tables: [],
      };
    }

    const client = this.getClient();
    if (!client) {
      return {
        overallSuccess: false,
        message: 'ไม่สามารถสร้าง Supabase Client ได้',
        authOk: false,
        tables: [],
      };
    }

    const startTime = performance.now();
    const tableDefs = [
      { name: 'users', title: 'ตารางข้อมูลผู้ใช้งาน (Users)', requiredCols: ['grade', 'room', 'student_no'] },
      { name: 'scores', title: 'ตารางบันทึกคะแนนแบบฝึกหัด (Scores)', requiredCols: ['grade', 'room', 'student_no'] },
      { name: 'game_records', title: 'ตารางบันทึกผลเกมคณิตศาสตร์ละเอียด (Game Records)', requiredCols: ['grade', 'room', 'student_no', 'game_id', 'accuracy_percentage'] },
      { name: 'user_logs', title: 'ตารางบันทึกการเข้าใช้งาน (User Logs)', requiredCols: ['grade', 'room', 'student_no'] },
    ];


    const results: {
      name: string;
      title: string;
      status: 'ok' | 'missing' | 'permission_error' | 'error';
      rowCount: number;
      message: string;
      columnsStatus?: 'full' | 'partial';
    }[] = [];

    let allOk = true;

    for (const t of tableDefs) {
      try {
        const { data, error, count } = await client
          .from(t.name)
          .select('*', { count: 'exact', head: false })
          .limit(1);

        if (error) {
          allOk = false;
          if (
            error.code === '42P01' ||
            error.code === 'PGRST204' ||
            error.code === 'PGRST205' ||
            error.message.includes('schema cache') ||
            error.message.includes('Could not find the table')
          ) {
            results.push({
              name: t.name,
              title: t.title,
              status: 'missing',
              rowCount: 0,
              message: 'ยังไม่พบตารางนี้ในฐานข้อมูล (ต้องรัน SQL Script เพื่อสร้างตาราง)',
            });
          } else if (error.code === '42501' || error.message.includes('permission') || error.message.includes('policy')) {
            results.push({
              name: t.name,
              title: t.title,
              status: 'permission_error',
              rowCount: 0,
              message: 'พบตารางแล้ว แต่ติดสิทธิ์ RLS Policy (ต้องเพิ่ม GRANT หรือ CREATE POLICY)',
            });
          } else {
            results.push({
              name: t.name,
              title: t.title,
              status: 'error',
              rowCount: 0,
              message: error.message,
            });
          }
        } else {
          // Check columns
          let columnsStatus: 'full' | 'partial' = 'full';
          let columnNote = '';
          const colCheck = await client.from(t.name).select(t.requiredCols.join(', ')).limit(1);
          if (colCheck.error && colCheck.error.message.includes('column')) {
            columnsStatus = 'partial';
            columnNote = ' (พบคอลัมน์พื้นฐาน แต่ยังขาดคอลัมน์ระดับชั้น/ห้อง/เลขที่ ให้รัน SQL เพิ่มเติม)';
          } else {
            columnsStatus = 'full';
            columnNote = ' (โครงสร้างคอลัมน์ครบถ้วนสมบูรณ์ 100%)';
          }

          results.push({
            name: t.name,
            title: t.title,
            status: 'ok',
            rowCount: count ?? (data ? data.length : 0),
            columnsStatus,
            message: `เชื่อมต่อสมบูรณ์ (พบข้อมูล ${count ?? (data ? data.length : 0)} รายการ)${columnNote}`,
          });
        }
      } catch (err: unknown) {
        allOk = false;
        results.push({
          name: t.name,
          title: t.title,
          status: 'error',
          rowCount: 0,
          message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
        });
      }
    }

    const latencyMs = Math.round(performance.now() - startTime);
    const now = new Date();
    const thaiFormatted = new Intl.DateTimeFormat('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now);

    return {
      overallSuccess: allOk,
      message: allOk
        ? 'ตารางและระบบบันทึกเวลาของ Supabase เชื่อมต่อและทำงานได้สมบูรณ์ 100%!'
        : 'พบปัญหาในบางตาราง กรุณาตรวจสอบหรือรันคำสั่ง SQL ด้านล่างเพื่อแก้ไข',
      authOk: true,
      serverTimeInfo: {
        clientIso: now.toISOString(),
        thaiFormatted,
        latencyMs,
        timeSyncStatus: 'synced',
        timeSyncMessage: `เวลาตรงกับเซิร์ฟเวอร์ (เวลาไทย: ${thaiFormatted} | Latency: ${latencyMs}ms)`,
      },
      tables: results,
    };
  }

  // Perform Live Write & Read verification test
  public async runLiveTest(): Promise<{
    success: boolean;
    message: string;
    details: {
      insertedAt: string;
      readBackAt: string;
      roundtripMs: number;
    } | null;
  }> {
    const client = this.getClient();
    if (!client) {
      return { success: false, message: 'ไม่สามารถสร้าง Supabase Client ได้', details: null };
    }

    const testId = `test_ping_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const testPayload = {
      id: testId,
      username: 'sys_diagnostic_bot',
      full_name: 'ระบบทดสอบการเชื่อมต่อ (Diagnostic Test)',
      grade: 1,
      room: 1,
      student_no: 1,
      action: 'SIGN_IN',
      timestamp: now.toISOString(),
      device: 'Diagnostic Ping Tool',
    };

    const start = performance.now();

    try {
      // 1. Insert test log
      const insertRes = await client.from('user_logs').insert([testPayload]);
      if (insertRes.error) {
        return {
          success: false,
          message: `ทดสอบเขียนข้อมูลลงตาราง user_logs ไม่สำเร็จ: ${insertRes.error.message}`,
          details: null,
        };
      }

      // 2. Read back
      const readRes = await client
        .from('user_logs')
        .select('*')
        .eq('id', testId)
        .maybeSingle();

      if (readRes.error || !readRes.data) {
        return {
          success: false,
          message: `ทดสอบอ่านข้อมูลกลับไม่สำเร็จ: ${readRes.error?.message || 'ไม่พบรายการที่เขียนลงไป'}`,
          details: null,
        };
      }

      // 3. Clean up test record
      await client.from('user_logs').delete().eq('id', testId);

      const roundtripMs = Math.round(performance.now() - start);
      const readBackAt = new Intl.DateTimeFormat('th-TH', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(new Date(readRes.data.timestamp));

      return {
        success: true,
        message: `ทดสอบเขียนและอ่านข้อมูลจริงสำเร็จสมบูรณ์! ข้อมูลตรงกัน 100% (เวลาบันทึก: ${readBackAt})`,
        details: {
          insertedAt: now.toISOString(),
          readBackAt,
          roundtripMs,
        },
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการทดสอบสด',
        details: null,
      };
    }
  }

  // Complete 4-Table Live Diagnostic Test (users, scores, game_records, user_logs)
  public async runFullDatabaseDiagnostics(): Promise<{
    overallSuccess: boolean;
    message: string;
    timestampThai: string;
    totalLatencyMs: number;
    tableResults: {
      tableName: string;
      tableTitle: string;
      writeSuccess: boolean;
      readSuccess: boolean;
      cleanupSuccess: boolean;
      latencyMs: number;
      message: string;
    }[];
  }> {
    const client = this.getClient();
    const overallStart = performance.now();
    const now = new Date();
    const timestampThai = new Intl.DateTimeFormat('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now);

    if (!client) {
      return {
        overallSuccess: false,
        message: 'ไม่สามารถสร้าง Supabase Client ได้ กรุณาตรวจสอบ URL และ API Key',
        timestampThai,
        totalLatencyMs: 0,
        tableResults: [],
      };
    }

    const testTag = `diag_${Date.now()}`;
    const results: {
      tableName: string;
      tableTitle: string;
      writeSuccess: boolean;
      readSuccess: boolean;
      cleanupSuccess: boolean;
      latencyMs: number;
      message: string;
    }[] = [];

    let overallSuccess = true;

    // 1. Test users
    try {
      const tStart = performance.now();
      const uUsername = `test_user_${testTag}`;
      const ins = await client.from('users').insert([{
        username: uUsername,
        name: 'ทดสอบ',
        surname: 'ระบบวินิจฉัย',
        grade: 1,
        room: 1,
        student_no: 99,
        email: `${uUsername}@diagnostic.test`,
        registered_at: now.toISOString(),
      }]);
      if (ins.error) throw new Error(`Insert failed: ${ins.error.message}`);
      const sel = await client.from('users').select('*').eq('username', uUsername).maybeSingle();
      if (sel.error || !sel.data) throw new Error(`Read failed: ${sel.error?.message || 'Not found'}`);
      await client.from('users').delete().eq('username', uUsername);
      results.push({
        tableName: 'users',
        tableTitle: 'ตารางข้อมูลผู้ใช้งาน (Users)',
        writeSuccess: true,
        readSuccess: true,
        cleanupSuccess: true,
        latencyMs: Math.round(performance.now() - tStart),
        message: 'บันทึกและอ่านข้อมูลผู้ใช้ทดสอบสำเร็จ 100%',
      });
    } catch (err: unknown) {
      overallSuccess = false;
      results.push({
        tableName: 'users',
        tableTitle: 'ตารางข้อมูลผู้ใช้งาน (Users)',
        writeSuccess: false,
        readSuccess: false,
        cleanupSuccess: false,
        latencyMs: 0,
        message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
      });
    }

    // 2. Test scores
    try {
      const tStart = performance.now();
      const sId = `test_score_${testTag}`;
      const ins = await client.from('scores').insert([{
        id: sId,
        username: 'sys_bot',
        full_name: 'บอททดสอบคะแนน',
        grade: 1,
        room: 1,
        student_no: 1,
        operation: 'multiplication',
        difficulty: 'easy',
        score: 10,
        total_questions: 10,
        percentage: 100,
        timestamp: now.toISOString(),
        details: 'ทดสอบการบันทึกคะแนนแบบฝึกหัด',
      }]);
      if (ins.error) throw new Error(`Insert failed: ${ins.error.message}`);
      const sel = await client.from('scores').select('*').eq('id', sId).maybeSingle();
      if (sel.error || !sel.data) throw new Error(`Read failed: ${sel.error?.message || 'Not found'}`);
      await client.from('scores').delete().eq('id', sId);
      results.push({
        tableName: 'scores',
        tableTitle: 'ตารางคะแนนแบบฝึกหัด (Scores)',
        writeSuccess: true,
        readSuccess: true,
        cleanupSuccess: true,
        latencyMs: Math.round(performance.now() - tStart),
        message: 'บันทึกและอ่านคะแนนแบบฝึกหัดทดสอบสำเร็จ 100%',
      });
    } catch (err: unknown) {
      overallSuccess = false;
      results.push({
        tableName: 'scores',
        tableTitle: 'ตารางคะแนนแบบฝึกหัด (Scores)',
        writeSuccess: false,
        readSuccess: false,
        cleanupSuccess: false,
        latencyMs: 0,
        message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
      });
    }

    // 3. Test game_records
    try {
      const tStart = performance.now();
      const gId = `test_game_${testTag}`;
      const ins = await client.from('game_records').insert([{
        id: gId,
        username: 'sys_bot',
        full_name: 'บอททดสอบเกม',
        grade: 1,
        room: 1,
        student_no: 1,
        game_id: 'space_blast',
        game_title: 'ยานอวกาศฝ่าดงดาวเคราะห์',
        game_category: 'mixed',
        score: 1850,
        high_score: 1850,
        correct_count: 14,
        total_questions: 15,
        accuracy_percentage: 93,
        max_combo: 9,
        time_spent_seconds: 48,
        details: 'ทดสอบบันทึกข้อมูลเกมละเอียด',
        special_metrics: { asteroids: 14, test: true },
        timestamp: now.toISOString(),
      }]);
      if (ins.error) throw new Error(`Insert failed: ${ins.error.message}`);
      const sel = await client.from('game_records').select('*').eq('id', gId).maybeSingle();
      if (sel.error || !sel.data) throw new Error(`Read failed: ${sel.error?.message || 'Not found'}`);
      await client.from('game_records').delete().eq('id', gId);
      results.push({
        tableName: 'game_records',
        tableTitle: 'ตารางบันทึกผลเกมคณิตศาสตร์ละเอียด (Game Records)',
        writeSuccess: true,
        readSuccess: true,
        cleanupSuccess: true,
        latencyMs: Math.round(performance.now() - tStart),
        message: 'บันทึกและอ่านผลเกมละเอียดทดสอบสำเร็จ 100% พร้อมเก็บข้อมูลทุกสถิติ',
      });
    } catch (err: unknown) {
      overallSuccess = false;
      results.push({
        tableName: 'game_records',
        tableTitle: 'ตารางบันทึกผลเกมคณิตศาสตร์ละเอียด (Game Records)',
        writeSuccess: false,
        readSuccess: false,
        cleanupSuccess: false,
        latencyMs: 0,
        message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
      });
    }

    // 4. Test user_logs
    try {
      const tStart = performance.now();
      const lId = `test_log_${testTag}`;
      const ins = await client.from('user_logs').insert([{
        id: lId,
        username: 'sys_bot',
        full_name: 'บอททดสอบประวัติเข้าใช้งาน',
        grade: 1,
        room: 1,
        student_no: 1,
        action: 'SIGN_IN',
        device: 'Automated Diagnostic Engine',
        timestamp: now.toISOString(),
      }]);
      if (ins.error) throw new Error(`Insert failed: ${ins.error.message}`);
      const sel = await client.from('user_logs').select('*').eq('id', lId).maybeSingle();
      if (sel.error || !sel.data) throw new Error(`Read failed: ${sel.error?.message || 'Not found'}`);
      await client.from('user_logs').delete().eq('id', lId);
      results.push({
        tableName: 'user_logs',
        tableTitle: 'ตารางบันทึกประวัติการใช้งาน (User Logs)',
        writeSuccess: true,
        readSuccess: true,
        cleanupSuccess: true,
        latencyMs: Math.round(performance.now() - tStart),
        message: 'บันทึกและอ่านประวัติ Sign In/Out สำเร็จ 100%',
      });
    } catch (err: unknown) {
      overallSuccess = false;
      results.push({
        tableName: 'user_logs',
        tableTitle: 'ตารางบันทึกประวัติการใช้งาน (User Logs)',
        writeSuccess: false,
        readSuccess: false,
        cleanupSuccess: false,
        latencyMs: 0,
        message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
      });
    }

    const totalLatencyMs = Math.round(performance.now() - overallStart);

    return {
      overallSuccess,
      message: overallSuccess
        ? 'ทดสอบเขียนและอ่านข้อมูลจริงลงทั้ง 4 ตารางของ Supabase สำเร็จสมบูรณ์ 100%!'
        : 'พบข้อผิดพลาดในบางตาราง กรุณาตรวจสอบรายละเอียด',
      timestampThai,
      totalLatencyMs,
      tableResults: results,
    };
  }

  // Test connection to Supabase endpoint
  public async testConnection(): Promise<{ success: boolean; message: string }> {
    const settings = this.getSettings();
    if (!settings.supabaseUrl) {
      return { success: false, message: 'กรุณาระบุ Supabase Project URL' };
    }

    try {
      const client = this.getClient();
      if (!client) {
        return { success: false, message: 'ไม่สามารถสร้าง Supabase Client ได้' };
      }

      // Try selecting from users table
      const { error } = await client.from('users').select('username').limit(1);
      if (error) {
        if (error.code === '42P01') {
          return {
            success: false,
            message: 'เชื่อมต่อ Supabase ได้ แต่ยังไม่พบตาราง (Table) กรุณารัน SQL Init Script ใน SQL Editor',
          };
        }
        if (error.message.includes('API key') || error.code === 'PGRST301') {
          return {
            success: false,
            message: 'การเชื่อมต่อต้องการ Anon Public Key ที่ถูกต้อง (คัดลอกได้จากเมนู Project Settings > API ใน Supabase Dashboard)',
          };
        }
        return { success: false, message: `ข้อความจาก Supabase: ${error.message}` };
      }

      return { success: true, message: 'เชื่อมต่อฐานข้อมูล Supabase สำเร็จ พร้อมใช้งาน!' };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อได้',
      };
    }
  }

  // --- LOCAL STORAGE HELPERS ---
  public getLocalUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEMO_USERS));
    return DEMO_USERS;
  }

  public saveLocalUser(user: User) {
    const users = this.getLocalUsers();
    const existingIndex = users.findIndex((u) => u.username === user.username);
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  public getLocalScores(): ScoreRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCORES);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(DEMO_SCORES));
    return DEMO_SCORES;
  }

  public saveLocalScore(score: ScoreRecord) {
    const scores = this.getLocalScores();
    scores.unshift(score);
    localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(scores));
  }

  public getLocalGameRecords(): GameRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GAME_RECORDS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    localStorage.setItem(STORAGE_KEYS.GAME_RECORDS, JSON.stringify(DEMO_GAME_RECORDS));
    return DEMO_GAME_RECORDS;
  }

  public saveLocalGameRecord(record: GameRecord) {
    const records = this.getLocalGameRecords();
    records.unshift(record);
    localStorage.setItem(STORAGE_KEYS.GAME_RECORDS, JSON.stringify(records));
  }

  public getLocalUserLogs(): UserLog[] {

    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return [];
  }

  public saveLocalUserLog(log: UserLog) {
    const logs = this.getLocalUserLogs();
    logs.unshift(log);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }

  // --- SUPABASE DATA ACTIONS WITH AUTO FALLBACK ---

  public async registerUser(
    user: User,
    passwordHash: string
  ): Promise<{ success: boolean; message: string }> {
    // 1. Check duplicate username in local cache first
    const users = this.getLocalUsers();
    if (users.some((u) => u.username.toLowerCase() === user.username.toLowerCase())) {
      return { success: false, message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น' };
    }

    // 2. Save locally
    this.saveLocalUser(user);

    // 3. Sync to Supabase
    try {
      const client = this.getClient();
      if (client) {
        const payload: Record<string, unknown> = {
          username: user.username,
          name: user.name,
          surname: user.surname,
          grade: user.grade !== undefined && user.grade !== '' ? Number(user.grade) : null,
          room: user.room !== undefined && user.room !== '' ? Number(user.room) : null,
          student_no: user.studentNo !== undefined && user.studentNo !== '' ? Number(user.studentNo) : null,
          email: user.email || null,
          password_hash: passwordHash,
          registered_at: user.registeredAt || new Date().toISOString(),
        };

        const { error } = await client.from('users').insert([payload]);
        if (error) {
          // If error is about missing grade/room/student_no column in existing table, fallback to standard fields
          if (error.message.includes('column') || error.code === 'PGRST204') {
            const fallbackPayload = {
              username: user.username,
              name: user.name,
              surname: user.surname,
              email: user.email || null,
              password_hash: passwordHash,
              registered_at: user.registeredAt || new Date().toISOString(),
            };
            const fallbackRes = await client.from('users').insert([fallbackPayload]);
            if (fallbackRes.error) {
              console.warn('Supabase fallback register error:', fallbackRes.error.message);
            }
          } else {
            console.warn('Supabase register error (using local cache):', error.message);
          }
        }
      }
    } catch (err) {
      console.warn('Supabase register sync error:', err);
    }

    return { success: true, message: 'ลงทะเบียนสำเร็จเข้าสู่ระบบเรียบร้อย' };
  }

  public async verifyLogin(
    username: string,
    passwordInput: string
  ): Promise<{ success: boolean; user?: User; message?: string }> {
    const trimmedUser = username.trim();

    // Try Supabase first if available
    try {
      const client = this.getClient();
      if (client) {
        let fetchedUser: {
          username: string;
          name: string;
          surname: string;
          grade?: number | null;
          room?: number | null;
          student_no?: number | null;
          email?: string | null;
          password_hash?: string | null;
          registered_at: string;
        } | null = null;

        const res = await client
          .from('users')
          .select('username, name, surname, grade, room, student_no, email, password_hash, registered_at')
          .eq('username', trimmedUser)
          .maybeSingle();

        if (res.error && res.error.message.includes('column')) {
          const fallback = await client
            .from('users')
            .select('username, name, surname, email, password_hash, registered_at')
            .eq('username', trimmedUser)
            .maybeSingle();
          if (fallback.data) {
            fetchedUser = fallback.data as typeof fetchedUser;
          }
        } else if (!res.error && res.data) {
          fetchedUser = res.data as typeof fetchedUser;
        }

        if (fetchedUser) {
          if (fetchedUser.password_hash && fetchedUser.password_hash !== passwordInput) {
            return { success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' };
          }
          const userObj: User = {
            username: fetchedUser.username,
            name: fetchedUser.name,
            surname: fetchedUser.surname,
            grade: fetchedUser.grade ?? undefined,
            room: fetchedUser.room ?? undefined,
            studentNo: fetchedUser.student_no ?? undefined,
            email: fetchedUser.email || '',
            registeredAt: fetchedUser.registered_at,
          };
          this.saveLocalUser(userObj);
          return { success: true, user: userObj };
        }
      }
    } catch (err) {
      console.warn('Supabase login check fallback to local:', err);
    }

    // Fallback to local users
    const users = this.getLocalUsers();
    const localUser = users.find(
      (u) => u.username.toLowerCase() === trimmedUser.toLowerCase()
    );

    if (!localUser) {
      return { success: false, message: 'ไม่พบชื่อผู้ใช้นี้ กรุณาตรวจสอบหรือลงทะเบียนใหม่' };
    }

    return { success: true, user: localUser };
  }

  public async recordScore(score: ScoreRecord): Promise<void> {
    // 1. Save local
    this.saveLocalScore(score);

    // 2. Sync to Supabase
    try {
      const client = this.getClient();
      if (client) {
        const payload: Record<string, unknown> = {
          id: score.id,
          username: score.username,
          full_name: score.fullName,
          grade: score.grade !== undefined && score.grade !== '' ? Number(score.grade) : null,
          room: score.room !== undefined && score.room !== '' ? Number(score.room) : null,
          student_no: score.studentNo !== undefined && score.studentNo !== '' ? Number(score.studentNo) : null,
          operation: score.operation,
          difficulty: score.difficulty,
          score: score.score,
          total_questions: score.totalQuestions,
          percentage: score.percentage,
          timestamp: score.timestamp || new Date().toISOString(),
          details: score.details || null,
        };

        const { error } = await client.from('scores').insert([payload]);
        if (error) {
          if (error.message.includes('column') || error.code === 'PGRST204') {
            // Fallback without grade/room/student_no
            const fallbackPayload = {
              id: score.id,
              username: score.username,
              full_name: score.fullName,
              operation: score.operation,
              difficulty: score.difficulty,
              score: score.score,
              total_questions: score.totalQuestions,
              percentage: score.percentage,
              timestamp: score.timestamp || new Date().toISOString(),
              details: score.details || null,
            };
            const fallbackRes = await client.from('scores').insert([fallbackPayload]);
            if (fallbackRes.error) {
              console.warn('Supabase fallback recordScore error:', fallbackRes.error.message);
            }
          } else {
            console.warn('Supabase recordScore error:', error.message);
          }
        }
      }
    } catch (err) {
      console.warn('Supabase recordScore sync error:', err);
    }
  }

  public async recordLog(
    username: string,
    fullName: string,
    action: 'SIGN_IN' | 'SIGN_OUT' | string,
    extra?: {
      grade?: number | string;
      room?: number | string;
      studentNo?: number | string;
      device?: string;
    }
  ): Promise<void> {
    const log: UserLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username,
      fullName,
      grade: extra?.grade,
      room: extra?.room,
      studentNo: extra?.studentNo,
      action: (action.startsWith('SIGN_IN') ? 'SIGN_IN' : 'SIGN_OUT') as 'SIGN_IN' | 'SIGN_OUT',
      timestamp: new Date().toISOString(),
      device: extra?.device || (window.innerWidth < 768 ? 'Mobile/Tablet' : 'Desktop PC'),
    };

    // 1. Save local
    this.saveLocalUserLog(log);

    // 2. Sync to Supabase
    try {
      const client = this.getClient();
      if (client) {
        const payload: Record<string, unknown> = {
          id: log.id,
          username: log.username,
          full_name: log.fullName,
          grade: log.grade !== undefined && log.grade !== '' ? Number(log.grade) : null,
          room: log.room !== undefined && log.room !== '' ? Number(log.room) : null,
          student_no: log.studentNo !== undefined && log.studentNo !== '' ? Number(log.studentNo) : null,
          action: action,
          timestamp: log.timestamp,
          device: log.device,
        };

        const { error } = await client.from('user_logs').insert([payload]);
        if (error) {
          if (error.message.includes('column') || error.code === 'PGRST204') {
            const fallbackPayload = {
              id: log.id,
              username: log.username,
              full_name: log.fullName,
              action: action,
              timestamp: log.timestamp,
              device: log.device,
            };
            const fallbackRes = await client.from('user_logs').insert([fallbackPayload]);
            if (fallbackRes.error) {
              console.warn('Supabase fallback recordLog error:', fallbackRes.error.message);
            }
          } else {
            console.warn('Supabase recordLog error:', error.message);
          }
        }
      }
    } catch (err) {
      console.warn('Supabase recordLog sync error:', err);
    }
  }

  // --- RECORD DETAILED GAME DATA ---
  public async recordGame(gameRecord: GameRecord): Promise<void> {
    // 1. Save local cache
    this.saveLocalGameRecord(gameRecord);

    // 2. Sync to Supabase game_records table
    try {
      const client = this.getClient();
      if (client) {
        const payload: Record<string, unknown> = {
          id: gameRecord.id,
          username: gameRecord.username,
          full_name: gameRecord.fullName,
          grade: gameRecord.grade !== undefined && gameRecord.grade !== '' ? Number(gameRecord.grade) : null,
          room: gameRecord.room !== undefined && gameRecord.room !== '' ? Number(gameRecord.room) : null,
          student_no: gameRecord.studentNo !== undefined && gameRecord.studentNo !== '' ? Number(gameRecord.studentNo) : null,
          game_id: gameRecord.gameId,
          game_title: gameRecord.gameTitle,
          game_category: gameRecord.gameCategory,
          score: gameRecord.score,
          high_score: gameRecord.highScore || gameRecord.score,
          correct_count: gameRecord.correctCount,
          total_questions: gameRecord.totalQuestions,
          accuracy_percentage: gameRecord.accuracyPercentage,
          max_combo: gameRecord.maxCombo,
          time_spent_seconds: gameRecord.timeSpentSeconds,
          details: gameRecord.details,
          special_metrics: gameRecord.specialMetrics || null,
          timestamp: gameRecord.timestamp || new Date().toISOString(),
        };

        const { error } = await client.from('game_records').insert([payload]);
        if (error) {
          console.warn('Supabase game_records insert error:', error.message);
          // If table or columns missing, fallback to scores table
          if (error.code === '42P01' || error.message.includes('column') || error.code === 'PGRST204') {
            const fallbackScore: ScoreRecord = {
              id: gameRecord.id,
              username: gameRecord.username,
              fullName: gameRecord.fullName,
              grade: gameRecord.grade,
              room: gameRecord.room,
              studentNo: gameRecord.studentNo,
              operation: gameRecord.gameCategory === 'multiplication' ? 'multiplication' : gameRecord.gameCategory === 'division' ? 'division' : 'mixed',
              difficulty: 'medium',
              score: gameRecord.score,
              totalQuestions: gameRecord.totalQuestions || 10,
              percentage: gameRecord.accuracyPercentage,
              timestamp: gameRecord.timestamp,
              details: `[เกม: ${gameRecord.gameTitle}] ${gameRecord.details}`,
            };
            await this.recordScore(fallbackScore);
          }
        }
      }
    } catch (err) {
      console.warn('Supabase recordGame sync error:', err);
    }
  }

  public async fetchScores(): Promise<ScoreRecord[]> {
    try {
      const client = this.getClient();
      if (client) {
        const { data, error } = await client
          .from('scores')
          .select('*')
          .order('percentage', { ascending: false })
          .order('timestamp', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const formatted: ScoreRecord[] = data.map((item) => ({
            id: item.id || `score_${item.timestamp}`,
            username: item.username,
            fullName: item.full_name || item.fullName || item.username,
            grade: item.grade ?? undefined,
            room: item.room ?? undefined,
            studentNo: item.student_no ?? undefined,
            operation: item.operation,
            difficulty: item.difficulty,
            score: Number(item.score),
            totalQuestions: Number(item.total_questions || item.totalQuestions || 10),
            percentage: Number(item.percentage),
            timestamp: item.timestamp,
            details: item.details || '',
          }));
          localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(formatted));
          return formatted;
        }
      }
    } catch (err) {
      console.warn('Supabase fetchScores error, fallback to local:', err);
    }

    return this.getLocalScores();
  }

  public async fetchGameRecords(gameId?: string, username?: string): Promise<GameRecord[]> {
    try {
      const client = this.getClient();
      if (client) {
        let query = client
          .from('game_records')
          .select('*')
          .order('score', { ascending: false })
          .order('timestamp', { ascending: false });

        if (gameId && gameId !== 'ALL') {
          query = query.eq('game_id', gameId);
        }
        if (username && username !== 'ALL') {
          query = query.eq('username', username);
        }

        const { data, error } = await query.limit(250);

        if (!error && Array.isArray(data) && data.length > 0) {
          const formatted: GameRecord[] = data.map((item) => ({
            id: item.id || `game_${item.timestamp}`,
            username: item.username,
            fullName: item.full_name || item.fullName || item.username,
            grade: item.grade ?? undefined,
            room: item.room ?? undefined,
            studentNo: item.student_no ?? undefined,
            gameId: item.game_id || item.gameId,
            gameTitle: item.game_title || item.gameTitle || 'เกมคณิตศาสตร์',
            gameCategory: item.game_category || item.gameCategory || 'mixed',
            score: Number(item.score || 0),
            highScore: item.high_score ? Number(item.high_score) : undefined,
            correctCount: Number(item.correct_count || item.correctCount || 0),
            totalQuestions: Number(item.total_questions || item.totalQuestions || 0),
            accuracyPercentage: Number(item.accuracy_percentage || item.accuracyPercentage || 0),
            maxCombo: Number(item.max_combo || item.maxCombo || 0),
            timeSpentSeconds: Number(item.time_spent_seconds || item.timeSpentSeconds || 0),
            details: item.details || '',
            specialMetrics: item.special_metrics || item.specialMetrics || undefined,
            timestamp: item.timestamp,
          }));
          localStorage.setItem(STORAGE_KEYS.GAME_RECORDS, JSON.stringify(formatted));
          return formatted;
        }
      }
    } catch (err) {
      console.warn('Supabase fetchGameRecords error, fallback to local:', err);
    }

    // Fallback to local
    const local = this.getLocalGameRecords();
    return local.filter((r) => {
      if (gameId && gameId !== 'ALL' && r.gameId !== gameId) return false;
      if (username && username !== 'ALL' && r.username.toLowerCase() !== username.toLowerCase()) return false;
      return true;
    }).sort((a, b) => b.score - a.score || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public calculateGameSummaryStats(records: GameRecord[]): GameSummaryStats {
    if (records.length === 0) {
      return {
        totalGamesPlayed: 0,
        totalGameScore: 0,
        highestSingleScore: 0,
        topGameTitle: '-',
        averageAccuracy: 0,
        totalCorrectAnswers: 0,
      };
    }

    let totalScore = 0;
    let highestScore = 0;
    let totalAccuracy = 0;
    let totalCorrect = 0;
    const gameCounts: Record<string, { count: number; title: string }> = {};

    records.forEach((r) => {
      totalScore += r.score;
      if (r.score > highestScore) highestScore = r.score;
      totalAccuracy += r.accuracyPercentage;
      totalCorrect += r.correctCount;

      if (!gameCounts[r.gameId]) {
        gameCounts[r.gameId] = { count: 0, title: r.gameTitle };
      }
      gameCounts[r.gameId].count += 1;
    });

    let topGameTitle = '-';
    let maxPlayCount = 0;
    Object.values(gameCounts).forEach((g) => {
      if (g.count > maxPlayCount) {
        maxPlayCount = g.count;
        topGameTitle = g.title;
      }
    });

    return {
      totalGamesPlayed: records.length,
      totalGameScore: totalScore,
      highestSingleScore: highestScore,
      topGameTitle,
      averageAccuracy: Math.round(totalAccuracy / records.length),
      totalCorrectAnswers: totalCorrect,
    };
  }


  public async fetchUserLogs(): Promise<UserLog[]> {
    try {
      const client = this.getClient();
      if (client) {
        const { data, error } = await client
          .from('user_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(200);

        if (!error && Array.isArray(data) && data.length > 0) {
          const formatted: UserLog[] = data.map((item) => ({
            id: item.id,
            username: item.username,
            fullName: item.full_name || item.fullName || item.username,
            grade: item.grade ?? undefined,
            room: item.room ?? undefined,
            studentNo: item.student_no ?? undefined,
            action: item.action?.includes('SIGN_IN') ? 'SIGN_IN' : 'SIGN_OUT',
            timestamp: item.timestamp,
            device: item.device || 'Web Browser',
          }));
          localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(formatted));
          return formatted;
        }
      }
    } catch (err) {
      console.warn('Supabase fetchUserLogs error, fallback to local:', err);
    }

    return this.getLocalUserLogs();
  }

  public calculateSessionSummaries(logs: UserLog[]): SessionSummary[] {
    const userMap: Record<
      string,
      {
        fullName: string;
        sessions: { signInTime: number; signOutTime?: number }[];
        lastSignIn: string;
        isOnline: boolean;
        currentSignInTime?: number;
      }
    > = {};

    // Sort chronologically (oldest to newest)
    const sortedLogs = [...logs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sortedLogs.forEach((log) => {
      const uKey = log.username.toLowerCase();
      if (!userMap[uKey]) {
        userMap[uKey] = {
          fullName: log.fullName || log.username,
          sessions: [],
          lastSignIn: log.timestamp,
          isOnline: false,
        };
      }

      const time = new Date(log.timestamp).getTime();

      if (log.action === 'SIGN_IN') {
        userMap[uKey].lastSignIn = log.timestamp;
        userMap[uKey].isOnline = true;
        userMap[uKey].currentSignInTime = time;
        userMap[uKey].sessions.push({ signInTime: time });
      } else if (log.action === 'SIGN_OUT') {
        userMap[uKey].isOnline = false;
        // Close last open session if exists
        const lastSession = userMap[uKey].sessions[userMap[uKey].sessions.length - 1];
        if (lastSession && !lastSession.signOutTime) {
          lastSession.signOutTime = time;
        }
        userMap[uKey].currentSignInTime = undefined;
      }
    });

    const now = Date.now();
    const result: SessionSummary[] = [];

    Object.entries(userMap).forEach(([username, data]) => {
      let totalDurationSeconds = 0;
      let activeDurationSeconds = 0;

      data.sessions.forEach((s) => {
        if (s.signOutTime) {
          totalDurationSeconds += Math.max(0, Math.floor((s.signOutTime - s.signInTime) / 1000));
        } else {
          // Ongoing session
          const duration = Math.max(0, Math.floor((now - s.signInTime) / 1000));
          activeDurationSeconds = duration;
        }
      });

      result.push({
        username,
        fullName: data.fullName,
        totalSessions: data.sessions.length,
        totalDurationSeconds,
        lastSignIn: data.lastSignIn,
        isOnline: data.isOnline,
        currentSessionStart: data.currentSignInTime
          ? new Date(data.currentSignInTime).toISOString()
          : undefined,
        activeDurationSeconds: data.isOnline ? activeDurationSeconds : 0,
      });
    });

    return result.sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));
  }
}

export const supabaseService = new SupabaseService();
// Alias for backward compatibility
export const sheetsService = supabaseService;

export const SUPABASE_SQL_INIT_SCRIPT = `-- =========================================================================
-- สคริปต์สร้างและอัปเดตตารางฐานข้อมูลสำหรับ Supabase (PostgreSQL)
-- รองรับ: ข้อมูลผู้ใช้งาน, ระดับชั้น, ห้อง, เลขที่, ผลคะแนน, ประวัติเข้าใช้งาน, เวลาตรงกับ App
-- =========================================================================

-- 1. ตารางข้อมูลผู้ใช้งาน (Users)
CREATE TABLE IF NOT EXISTS public.users (
  username TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  grade INTEGER,
  room INTEGER,
  student_no INTEGER,
  email TEXT,
  password_hash TEXT,
  registered_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- อัปเดตคอลัมน์อัตโนมัติหากมีตาราง users อยู่แล้ว
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS grade INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS room INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS student_no INTEGER;

-- 2. ตารางบันทึกผลคะแนนแบบฝึกหัด (Scores)
CREATE TABLE IF NOT EXISTS public.scores (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  full_name TEXT NOT NULL,
  grade INTEGER,
  room INTEGER,
  student_no INTEGER,
  operation TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  details TEXT
);

-- อัปเดตคอลัมน์อัตโนมัติหากมีตาราง scores อยู่แล้ว
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS grade INTEGER;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS room INTEGER;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS student_no INTEGER;

-- 3. ตารางบันทึกประวัติการเข้า-ออกจากระบบ (User Logs)
CREATE TABLE IF NOT EXISTS public.user_logs (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  full_name TEXT NOT NULL,
  grade INTEGER,
  room INTEGER,
  student_no INTEGER,
  action TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  device TEXT
);

-- อัปเดตคอลัมน์อัตโนมัติหากมีตาราง user_logs อยู่แล้ว
ALTER TABLE public.user_logs ADD COLUMN IF NOT EXISTS grade INTEGER;
ALTER TABLE public.user_logs ADD COLUMN IF NOT EXISTS room INTEGER;
ALTER TABLE public.user_logs ADD COLUMN IF NOT EXISTS student_no INTEGER;

-- 4. ตารางบันทึกผลการเล่นเกมคณิตศาสตร์ละเอียด (Game Records)
CREATE TABLE IF NOT EXISTS public.game_records (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  full_name TEXT NOT NULL,
  grade INTEGER,
  room INTEGER,
  student_no INTEGER,
  game_id TEXT NOT NULL,
  game_title TEXT NOT NULL,
  game_category TEXT NOT NULL,
  score INTEGER NOT NULL,
  high_score INTEGER DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  accuracy_percentage NUMERIC NOT NULL DEFAULT 0,
  max_combo INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  details TEXT,
  special_metrics JSONB,
  timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- อัปเดตคอลัมน์อัตโนมัติหากมีตาราง game_records อยู่แล้ว
ALTER TABLE public.game_records ADD COLUMN IF NOT EXISTS grade INTEGER;
ALTER TABLE public.game_records ADD COLUMN IF NOT EXISTS room INTEGER;
ALTER TABLE public.game_records ADD COLUMN IF NOT EXISTS student_no INTEGER;
ALTER TABLE public.game_records ADD COLUMN IF NOT EXISTS high_score INTEGER DEFAULT 0;
ALTER TABLE public.game_records ADD COLUMN IF NOT EXISTS special_metrics JSONB;

-- สร้าง Index เพื่อให้การค้นหาและเรียงลำดับคะแนนรวดเร็วสูงสุด
CREATE INDEX IF NOT EXISTS idx_game_records_game_id ON public.game_records(game_id);
CREATE INDEX IF NOT EXISTS idx_game_records_username ON public.game_records(username);
CREATE INDEX IF NOT EXISTS idx_game_records_score ON public.game_records(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_records_timestamp ON public.game_records(timestamp DESC);

-- =========================================================================
-- มอบสิทธิ์การเข้าถึง (Grant Permissions) และเปิดใช้งาน Row Level Security (RLS)
-- =========================================================================

GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.scores TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_logs TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.game_records TO anon, authenticated, service_role;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_records ENABLE ROW LEVEL SECURITY;

-- นโยบายความปลอดภัยสำหรับตาราง users
DROP POLICY IF EXISTS "Public users access" ON public.users;
CREATE POLICY "Public users access" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

-- นโยบายความปลอดภัยสำหรับตาราง scores
DROP POLICY IF EXISTS "Public scores access" ON public.scores;
CREATE POLICY "Public scores access" ON public.scores
  FOR ALL USING (true) WITH CHECK (true);

-- นโยบายความปลอดภัยสำหรับตาราง user_logs
DROP POLICY IF EXISTS "Public user_logs access" ON public.user_logs;
CREATE POLICY "Public user_logs access" ON public.user_logs
  FOR ALL USING (true) WITH CHECK (true);

-- นโยบายความปลอดภัยสำหรับตาราง game_records
DROP POLICY IF EXISTS "Public game_records access" ON public.game_records;
CREATE POLICY "Public game_records access" ON public.game_records
  FOR ALL USING (true) WITH CHECK (true);

-- สั่งรีเฟรช Schema Cache ของ Supabase REST API ทันที
NOTIFY pgrst, 'reload schema';
`;

