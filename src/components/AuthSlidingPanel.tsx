import React, { useState } from 'react';
import {
  UserCheck,
  UserPlus,
  LogIn,
  KeyRound,
  Mail,
  User as UserIcon,
  Sparkles,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  Database,
} from 'lucide-react';
import { User } from '../types';
import { supabaseService } from '../services/supabaseService';
import { soundFx } from '../services/sound';

interface AuthSlidingPanelProps {
  onLoginSuccess: (user: User) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSupabaseModal: () => void;
}

export const AuthSlidingPanel: React.FC<AuthSlidingPanelProps> = ({
  onLoginSuccess,
  theme,
  onToggleTheme,
  onOpenSupabaseModal,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [grade, setGrade] = useState('');
  const [room, setRoom] = useState('');
  const [studentNo, setStudentNo] = useState('');
  const [email, setEmail] = useState('');

  // Status & Error
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleToggleMode = () => {
    soundFx.playClick();
    setIsSignUp(!isSignUp);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน');
      return;
    }

    setLoading(true);
    soundFx.playClick();

    try {
      const loginResult = await supabaseService.verifyLogin(username, password);

      if (!loginResult.success || !loginResult.user) {
        setErrorMsg(loginResult.message || 'ไม่พบชื่อผู้ใช้นี้ กรุณาตรวจสอบหรือลงทะเบียนใหม่');
        setLoading(false);
        return;
      }

      const user = loginResult.user;

      // Log sign in event
      await supabaseService.recordLog(
        user.username,
        `${user.name} ${user.surname}`,
        'SIGN_IN',
        {
          grade: user.grade,
          room: user.room,
          studentNo: user.studentNo,
        }
      );

      setSuccessMsg(`ยินดีต้อนรับ ${user.name} ${user.surname} เข้าสู่ระบบ!`);
      setTimeout(() => {
        onLoginSuccess(user);
      }, 500);
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (
      !name.trim() ||
      !surname.trim() ||
      !grade ||
      !room ||
      !studentNo ||
      !username.trim() ||
      !password.trim()
    ) {
      setErrorMsg('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (รวมถึง ระดับชั้น ห้อง และเลขที่)');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (password.length < 4) {
      setErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    setLoading(true);
    soundFx.playClick();

    const newUser: User = {
      username: username.trim(),
      name: name.trim(),
      surname: surname.trim(),
      grade: Number(grade),
      room: Number(room),
      studentNo: Number(studentNo),
      email: email.trim(),
      registeredAt: new Date().toISOString(),
    };

    const result = await supabaseService.registerUser(newUser, password);

    if (!result.success) {
      setErrorMsg(result.message);
      setLoading(false);
    } else {
      // Record Sign In log immediately
      await supabaseService.recordLog(
        newUser.username,
        `${newUser.name} ${newUser.surname}`,
        'SIGN_IN',
        {
          grade: newUser.grade,
          room: newUser.room,
          studentNo: newUser.studentNo,
        }
      );
      setSuccessMsg('ลงทะเบียนสำเร็จ กำลังนำท่านเข้าสู่ระบบ...');
      setTimeout(() => {
        onLoginSuccess(newUser);
      }, 700);
    }
  };

  const handleGuestLogin = async () => {
    soundFx.playClick();
    const guestUser: User = {
      username: `guest_${Math.floor(1000 + Math.random() * 9000)}`,
      name: 'ผู้เยี่ยมชม',
      surname: '(Guest)',
      email: 'guest@mathapp.local',
      registeredAt: new Date().toISOString(),
    };

    supabaseService.saveLocalUser(guestUser);
    await supabaseService.recordLog(guestUser.username, `${guestUser.name} ${guestUser.surname}`, 'SIGN_IN');
    onLoginSuccess(guestUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-slate-100 relative overflow-hidden">
      {/* Dynamic Background Circles */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Floating Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
        <button
          onClick={onOpenSupabaseModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md transition"
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>ฐานข้อมูล Supabase</span>
        </button>
        <button
          onClick={onToggleTheme}
          className="p-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-amber-400 border border-slate-200 dark:border-slate-700 backdrop-blur-md transition shadow-md"
          title={theme === 'dark' ? 'สลับเป็นโหมดสว่าง (Light Mode)' : 'สลับเป็นโหมดมืด (Dark Mode)'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>
      </div>

      {/* Auth Card Container */}
      <div className="w-full max-w-4xl bg-white/10 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative min-h-[580px] flex flex-col md:flex-row">
        
        {/* Left / Right Sliding Overlay Branding Banner (Desktop & Mobile) */}
        <div
          className={`md:w-1/2 p-8 sm:p-10 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex flex-col justify-between transition-all duration-500 z-20 ${
            isSignUp ? 'md:translate-x-full' : 'md:translate-x-0'
          }`}
        >
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg shrink-0">
                <Sparkles className="w-7 h-7 text-amber-300" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-white leading-tight">
                  การคูณและการหารจำนวนเต็ม
                </h1>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
              {isSignUp ? 'ยินดีต้อนรับกลับมา!' : 'สร้างบัญชีเข้าใช้งานใหม่'}
            </h2>
            <p className="text-indigo-100 text-sm leading-relaxed mb-6">
              {isSignUp
                ? 'หากคุณมีบัญชีผู้ใช้อยู่แล้ว สลับไปที่หน้าเข้าสู่ระบบเพื่อฝึกทักษะต่อได้ทันที'
                : 'ลงทะเบียนเพื่อบันทึกผลคะแนนและระยะเวลาการเรียนรู้อย่างเป็นระบบ Sync ตรงสู่ฐานข้อมูล Supabase'}
            </p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleToggleMode}
              className="w-full py-3 px-6 rounded-2xl bg-white/20 hover:bg-white/30 active:scale-95 border border-white/40 font-bold text-sm backdrop-blur-md transition shadow-md flex items-center justify-center gap-2"
            >
              {isSignUp ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{isSignUp ? 'สลับไปที่: เข้าสู่ระบบ (Sign In)' : 'สลับไปที่: ลงทะเบียน (Sign Up)'}</span>
            </button>

            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 text-xs font-semibold backdrop-blur-md transition flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-4 h-4 text-amber-300" />
              <span>ใช้งานโดนไม่เข้าระบบ (Guest Mode)</span>
            </button>
          </div>
        </div>

        {/* Form Container (Sign In / Sign Up) */}
        <div
          className={`md:w-1/2 p-6 sm:p-10 flex flex-col justify-center bg-slate-900/60 dark:bg-slate-950/80 transition-all duration-500 ${
            isSignUp ? 'md:-translate-x-full' : 'md:translate-x-0'
          }`}
        >
          {/* Form Title */}
          <div className="mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 flex items-center gap-2">
              {isSignUp ? (
                <>
                  <UserPlus className="w-6 h-6 text-indigo-400" /> ลงทะเบียนสมาชิก
                </>
              ) : (
                <>
                  <LogIn className="w-6 h-6 text-indigo-400" /> เข้าสู่ระบบ
                </>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              การคูณและการหารจำนวนเต็ม App
            </p>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Sign In Form */}
          {!isSignUp && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ชื่อผู้ใช้ (Username)
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="กรอกชื่อผู้ใช้ เช่น student01"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่าน"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 text-sm transition transform active:scale-95 disabled:opacity-50"
              >
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Sign In)'}
              </button>
            </form>
          )}

          {/* Sign Up Form */}
          {isSignUp && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    ชื่อ <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="สมชาย"
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    นามสกุล <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder="ใจดี"
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* ระดับชั้น, ห้อง, เลขที่ (Dropdowns) */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    ระดับชั้น <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    required
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-400">
                      เลือกชั้น
                    </option>
                    {[1, 2, 3, 4, 5, 6].map((g) => (
                      <option key={g} value={g} className="bg-slate-900 text-white">
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    ห้อง <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    required
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-400">
                      เลือกห้อง
                    </option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((r) => (
                      <option key={r} value={r} className="bg-slate-900 text-white">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    เลขที่ <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={studentNo}
                    onChange={(e) => setStudentNo(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    required
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-400">
                      เลือกเลขที่
                    </option>
                    {Array.from({ length: 45 }, (_, i) => i + 1).map((no) => (
                      <option key={no} value={no} className="bg-slate-900 text-white">
                        {no}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ชื่อผู้ใช้ (Username)
                </label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="เช่น somchai2026"
                    className="w-full pl-8 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  อีเมล (Email - ไม่บังคับ)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="somchai@example.com (ไม่บังคับ)"
                    className="w-full pl-8 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    รหัสผ่าน
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="อย่างน้อย 4 ตัว"
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    ยืนยันรหัสผ่าน
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="กรอกซ้ำ"
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 text-xs transition transform active:scale-95 disabled:opacity-50"
              >
                {loading ? 'กำลังบันทึกข้อมูล...' : 'ลงทะเบียนบัญชีใหม่ (Sign Up)'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
