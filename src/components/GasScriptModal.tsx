import React, { useState } from 'react';
import {
  X,
  Database,
  Copy,
  Check,
  ExternalLink,
  Save,
  HelpCircle,
  Sparkles,
  Server,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  supabaseService,
  DEFAULT_SUPABASE_SETTINGS,
  SUPABASE_SQL_INIT_SCRIPT,
} from '../services/supabaseService';
import { soundFx } from '../services/sound';

interface GasScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GasScriptModal: React.FC<GasScriptModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => {
    return supabaseService.getSettings().supabaseUrl || DEFAULT_SUPABASE_SETTINGS.supabaseUrl;
  });

  const [supabaseAnonKeyInput, setSupabaseAnonKeyInput] = useState(() => {
    return supabaseService.getSettings().supabaseAnonKey || '';
  });

  const [savedStatus, setSavedStatus] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testingLive, setTestingLive] = useState(false);
  const [liveTestResult, setLiveTestResult] = useState<{
    success: boolean;
    message: string;
    details: {
      insertedAt: string;
      readBackAt: string;
      roundtripMs: number;
    } | null;
  } | null>(null);

  const [testResult, setTestResult] = useState<{
    overallSuccess: boolean;
    message: string;
    authOk?: boolean;
    serverTimeInfo?: {
      clientIso: string;
      thaiFormatted: string;
      latencyMs: number;
      timeSyncStatus: string;
      timeSyncMessage: string;
    };
    tables?: {
      name: string;
      title: string;
      status: 'ok' | 'missing' | 'permission_error' | 'error';
      rowCount: number;
      columnsStatus?: 'full' | 'partial' | 'missing';
      message: string;
    }[];
  } | null>(null);

  if (!isOpen) return null;

  const handleCopySql = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(SUPABASE_SQL_INIT_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = () => {
    soundFx.playClick();
    supabaseService.saveSettings({
      supabaseUrl: supabaseUrlInput.trim(),
      supabaseAnonKey: supabaseAnonKeyInput.trim(),
    });
    setSavedStatus('บันทึกการตั้งค่าเรียบร้อยแล้ว!');
    setTimeout(() => setSavedStatus(''), 3000);
  };

  const handleTestConnection = async () => {
    soundFx.playClick();
    setTestingConnection(true);
    setTestResult(null);

    // Save first then test
    supabaseService.saveSettings({
      supabaseUrl: supabaseUrlInput.trim(),
      supabaseAnonKey: supabaseAnonKeyInput.trim(),
    });

    const res = await supabaseService.testAllTables();
    setTestResult(res);
    setTestingConnection(false);
  };

  const handleRunLiveTest = async () => {
    soundFx.playClick();
    setTestingLive(true);
    setLiveTestResult(null);

    const res = await supabaseService.runLiveTest();
    setLiveTestResult(res);
    setTestingLive(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
              <Database className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl leading-tight">
                ตั้งค่าฐานข้อมูล Supabase (Database Settings)
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                เชื่อมต่อฐานข้อมูล PostgreSQL บน Supabase สำหรับบันทึกคะแนนและผู้ใช้งาน
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Connection Settings Box */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                <Server className="w-4 h-4" /> ข้อมูลการเชื่อมต่อฐานข้อมูล (Supabase Config)
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                ● กำหนดค่าแล้ว
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supabase Project URL:
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="https://nweygxwkmleisidemdbq.supabase.co"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    Supabase Anon Public API Key (ถ้ามี):
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (คัดลอกจาก Project Settings ➔ API)
                  </span>
                </label>
                <input
                  type="text"
                  value={supabaseAnonKeyInput}
                  onChange={(e) => setSupabaseAnonKeyInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Action Buttons & Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> บันทึกการตั้งค่า
                  </button>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                    {testingConnection ? 'กำลังทดสอบทุกตาราง...' : 'ทดสอบการเชื่อมต่อทุกตาราง'}
                  </button>

                  <button
                    type="button"
                    onClick={handleRunLiveTest}
                    disabled={testingLive}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${testingLive ? 'animate-spin' : ''}`} />
                    {testingLive ? 'กำลังทดสอบเขียน-อ่านสด...' : 'ทดสอบเขียนและอ่านข้อมูลสด (Live Test)'}
                  </button>
                </div>

                {savedStatus && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {savedStatus}
                  </span>
                )}
              </div>

              {/* Live Write & Read Test Result Box */}
              {liveTestResult && (
                <div
                  className={`p-3.5 rounded-2xl text-xs border flex items-start gap-2.5 animate-fadeIn ${
                    liveTestResult.success
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-950 dark:text-indigo-200'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200'
                  }`}
                >
                  {liveTestResult.success ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold">{liveTestResult.message}</p>
                    {liveTestResult.details && (
                      <p className="text-[11px] font-mono opacity-85">
                        Latency Roundtrip: {liveTestResult.details.roundtripMs}ms | เวลาทดสอบ: {liveTestResult.details.readBackAt}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Detailed Test Result Breakdown */}
              {testResult && (
                <div className="space-y-2.5 pt-2 animate-fadeIn">
                  <div
                    className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border ${
                      testResult.overallSuccess
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
                    }`}
                  >
                    {testResult.overallSuccess ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-bold text-xs leading-relaxed">{testResult.message}</p>
                    </div>
                  </div>

                  {/* Server Time Alignment Card */}
                  {testResult.serverTimeInfo && (
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            ความเที่ยงตรงของเวลา (Time Sync):
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {testResult.serverTimeInfo.timeSyncMessage}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold shrink-0">
                        ตรงกัน 100% (Asia/Bangkok)
                      </span>
                    </div>
                  )}

                  {/* Individual Table Diagnostics */}
                  {testResult.tables && testResult.tables.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 pt-1">
                      {testResult.tables.map((t) => (
                        <div
                          key={t.name}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                            t.status === 'ok'
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                              : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {t.status === 'ok' ? (
                              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 font-bold" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-3.5 h-3.5 font-bold" />
                              </div>
                            )}
                            <div className="truncate">
                              <p className="font-bold">{t.title} <code className="text-[10px] font-mono px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">public.{t.name}</code></p>
                              <p className="text-[11px] opacity-80 truncate">{t.message}</p>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            {t.status === 'ok' ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                พร้อมใช้งาน ({t.rowCount} รายการ)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                                {t.status === 'missing' ? 'ไม่พบตาราง' : 'ต้องแก้ไขสิทธิ์'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Supabase SQL Init Script Guide */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-sm">
              <HelpCircle className="w-4 h-4 text-emerald-500" /> ขั้นตอนสร้างตารางใน Supabase (SQL Editor Guide):
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300 leading-relaxed">
              <li>เปิด Supabase Dashboard ที่โครงการของคุณ (<strong>nweygxwkmleisidemdbq</strong>)</li>
              <li>ไปที่เมนู <strong>SQL Editor</strong> ทางแถบซ้ายมือ</li>
              <li>กดปุ่ม <strong>New query</strong> (สร้างคำสั่งใหม่)</li>
              <li>กดปุ่ม <strong>"คัดลอกโค้ด SQL ทั้งหมด"</strong> ด้านล่างนี้ แล้วนำไปวาง (Paste) ลงในช่องคำสั่ง</li>
              <li>กดปุ่ม <strong>Run (Ctrl+Enter)</strong> เพื่อสร้างตาราง <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">users</code>, <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">scores</code>, และ <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">user_logs</code> พร้อมนโยบายความปลอดภัยอัตโนมัติ</li>
            </ol>
          </div>

          {/* Code Viewer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                สคริปต์ SQL สร้างตาราง (PostgreSQL Schema):
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-amber-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'คัดลอกเรียบร้อยแล้ว!' : 'คัดลอกโค้ด SQL ทั้งหมด'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-200 font-mono text-[11px] overflow-x-auto max-h-60 border border-slate-800 leading-relaxed">
              {SUPABASE_SQL_INIT_SCRIPT}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
