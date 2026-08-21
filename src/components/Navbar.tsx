import React from 'react';
import {
  BookOpen,
  Sparkles,
  Calculator,
  Gamepad2,
  Award,
  BarChart3,
  Database,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onSignOut: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  onOpenSupabaseModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onSignOut,
  theme,
  onToggleTheme,
  soundMuted,
  onToggleSound,
  onOpenSupabaseModal,
}) => {
  const navItems = [
    { id: 'summary', label: 'สรุปความรู้', icon: BookOpen },
    { id: 'interactive', label: 'สื่อ Interactive', icon: Sparkles },
    { id: 'exercise', label: 'แบบฝึกหัด', icon: Calculator },
    { id: 'games', label: 'เกม', icon: Gamepad2 },
    { id: 'scores', label: 'คะแนน', icon: Award },
    { id: 'analytics', label: 'วิเคราะห์', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Calculator className="w-6 h-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight">
                การคูณและการหารจำนวนเต็ม
              </h1>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Math Mastery App
              </p>
            </div>
          </div>

          {/* Nav Items (Desktop/Tablet) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Tools & User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Supabase Database Guide Button */}
            <button
              onClick={onOpenSupabaseModal}
              title="ตั้งค่าฐานข้อมูล Supabase"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold transition"
            >
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden xs:inline">ฐานข้อมูล Supabase</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              title={soundMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {soundMuted ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-500" />
              )}
            </button>

            {/* Theme Toggle (☀️ / 🌙) */}
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'สลับเป็นโหมดสว่าง (Light Mode)' : 'สลับเป็นโหมดมืด (Dark Mode)'}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition shadow-xs"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* User Info / Sign Out */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                    {currentUser.name} {currentUser.surname}
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                    {currentUser.grade && currentUser.room
                      ? `ชั้น ${currentUser.grade}/${currentUser.room} เลขที่ ${currentUser.studentNo ?? '-'}`
                      : `@${currentUser.username}`}
                  </span>
                </div>
                <button
                  onClick={onSignOut}
                  title="ออกจากระบบ"
                  className="flex items-center gap-1 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs font-semibold transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">ออก</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar (Bottom Sticky for Phones) */}
      <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-2 py-1.5">
        <div className="grid grid-cols-5 gap-1 text-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-1 rounded-lg transition-colors ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/50'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[11px] leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
