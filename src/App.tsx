/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from './types';
import { supabaseService } from './services/supabaseService';
import { soundFx } from './services/sound';
import { Navbar } from './components/Navbar';
import { AuthSlidingPanel } from './components/AuthSlidingPanel';
import { KnowledgeSummary } from './components/KnowledgeSummary';
import { InteractiveLearning } from './components/InteractiveLearning';
import { ExerciseQuiz } from './components/ExerciseQuiz';
import { GameHub } from './components/games/GameHub';
import { LeaderboardAndLogs } from './components/LeaderboardAndLogs';
import { SupabaseSettingsModal } from './components/SupabaseSettingsModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('math_app_current_user');
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<string>('summary');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const storedTheme = localStorage.getItem('math_app_theme');
      if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
    } catch {
      // fallback
    }
    return 'dark';
  });
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);

  // Sync theme class on HTML & body element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('math_app_theme', theme);
  }, [theme]);

  // Handle user sign in
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('math_app_current_user', JSON.stringify(user));
  };

  // Handle user sign out
  const handleSignOut = async () => {
    soundFx.playClick();
    if (currentUser) {
      await supabaseService.recordLog(
        currentUser.username,
        `${currentUser.name} ${currentUser.surname}`,
        'SIGN_OUT',
        {
          grade: currentUser.grade,
          room: currentUser.room,
          studentNo: currentUser.studentNo,
        }
      );
    }
    setCurrentUser(null);
    localStorage.removeItem('math_app_current_user');
  };

  const handleToggleTheme = () => {
    soundFx.playClick();
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleToggleSound = () => {
    const nextMuted = !soundMuted;
    setSoundMuted(nextMuted);
    soundFx.setMuted(nextMuted);
    if (!nextMuted) {
      soundFx.playClick();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* If not logged in, show Auth Sliding Panel */}
      {!currentUser ? (
        <AuthSlidingPanel
          onLoginSuccess={handleLoginSuccess}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        />
      ) : (
        <>
          {/* Top Sticky Navigation */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            onSignOut={handleSignOut}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            soundMuted={soundMuted}
            onToggleSound={handleToggleSound}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          />

          {/* Main App Workspace */}
          <main className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto pb-20 md:pb-12">
            {activeTab === 'summary' && <KnowledgeSummary />}
            {activeTab === 'interactive' && <InteractiveLearning />}
            {activeTab === 'exercise' && (
              <ExerciseQuiz
                currentUser={currentUser}
                onFinishQuiz={() => setActiveTab('leaderboard')}
              />
            )}
            {activeTab === 'games' && <GameHub currentUser={currentUser} />}
            {activeTab === 'leaderboard' && <LeaderboardAndLogs />}
          </main>
        </>
      )}

      {/* Supabase Settings Modal */}
      <SupabaseSettingsModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {/* Footer */}
      <footer className={`py-3 px-4 text-center text-xs border-t transition-colors ${
        theme === 'dark'
          ? 'bg-slate-950 text-slate-400 border-slate-900'
          : 'bg-white text-slate-600 border-slate-200'
      }`}>
        <p className="font-semibold leading-relaxed">
          พัฒนาโดย ครูดรณ์ สุขอนันตกุล ครูโรงเรียนกำแพงแสนวิทยา
        </p>
      </footer>
    </div>
  );
}
