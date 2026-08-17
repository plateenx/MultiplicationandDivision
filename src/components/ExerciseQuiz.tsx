import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Calculator,
  Trophy,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Brain,
  ShieldAlert,
} from 'lucide-react';
import { Question, OperationType, DifficultyLevel, User, ScoreRecord } from '../types';
import { generateQuestions } from '../utils/mathGenerator';
import { DigitalKeypad } from './DigitalKeypad';
import { soundFx } from '../services/sound';
import { supabaseService } from '../services/supabaseService';
import { getThailandIsoString } from '../utils/dateUtils';

interface ExerciseQuizProps {
  currentUser: User | null;
  onFinishQuiz: () => void;
}

export const ExerciseQuiz: React.FC<ExerciseQuizProps> = ({
  currentUser,
  onFinishQuiz,
}) => {
  // Setup selections
  const [operation, setOperation] = useState<OperationType>('multiplication');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [questionCount, setQuestionCount] = useState<number>(10);

  // Quiz state
  const [isQuizStarted, setIsQuizStarted] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentInput, setCurrentInput] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isQuizFinished, setIsQuizFinished] = useState<boolean>(false);
  const [scoreRecord, setScoreRecord] = useState<ScoreRecord | null>(null);

  // Keyboard shortcut for desktop: Press 'Enter' or 'Space' to advance to Next Question
  useEffect(() => {
    if (!showExplanation || isQuizFinished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showExplanation, isQuizFinished, currentIndex, questions, answers]);

  const startQuiz = () => {
    soundFx.playClick();
    const generated = generateQuestions(operation, difficulty, questionCount);
    setQuestions(generated);
    setCurrentIndex(0);
    setAnswers({});
    setCurrentInput('');
    setShowExplanation(false);
    setIsQuizFinished(false);
    setIsQuizStarted(true);
  };

  const handleKeypadSubmit = () => {
    if (!currentInput.trim() || currentInput === '-') return;

    const q = questions[currentIndex];
    const userVal = parseInt(currentInput, 10);

    // Record answer
    const newAnswers = { ...answers, [q.id]: currentInput };
    setAnswers(newAnswers);

    // Check correctness sound
    if (userVal === q.correctAnswer) {
      soundFx.playCorrect();
    } else {
      soundFx.playWrong();
    }

    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    soundFx.playClick();
    setShowExplanation(false);
    setCurrentInput('');

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Quiz complete!
      calculateAndSaveResults();
    }
  };

  const calculateAndSaveResults = async () => {
    let totalScore = 0;
    questions.forEach((q) => {
      const userAnsStr = answers[q.id];
      if (userAnsStr !== undefined && parseInt(userAnsStr, 10) === q.correctAnswer) {
        totalScore += 1;
      }
    });

    const percentage = Math.round((totalScore / questions.length) * 100);

    const record: ScoreRecord = {
      id: `score_${Date.now()}`,
      username: currentUser ? currentUser.username : 'guest',
      fullName: currentUser ? `${currentUser.name} ${currentUser.surname}` : 'ผู้เยี่ยมชม (Guest)',
      grade: currentUser?.grade,
      room: currentUser?.room,
      studentNo: currentUser?.studentNo,
      operation,
      difficulty,
      score: totalScore,
      totalQuestions: questions.length,
      percentage,
      timestamp: getThailandIsoString(),
      details: `โจทย์แบบฝึกหัด (${getOpLabel(operation)}) ระดับ ${getDiffLabel(difficulty)}`,
    };

    setScoreRecord(record);
    setIsQuizFinished(true);

    // Save to Supabase and local storage
    await supabaseService.recordScore(record);

    // Trigger celebration if passing grade (>= 70%)
    if (percentage >= 70) {
      soundFx.playFanfare();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const getOpLabel = (op: OperationType) => {
    switch (op) {
      case 'multiplication':
        return 'การคูณ';
      case 'division':
        return 'การหาร';
      case 'mixed':
        return 'ผสมคูณและหาร';
      case 'puzzle':
        return 'โจทย์ทายจำนวน';
    }
  };

  const getDiffLabel = (diff: DifficultyLevel) => {
    switch (diff) {
      case 'easy':
        return 'ง่าย';
      case 'medium':
        return 'ปานกลาง';
      case 'hard':
        return 'ยาก / มีวงเล็บ [ ]';
    }
  };

  // If quiz is completed, show score summary & full solution explanations
  if (isQuizFinished && scoreRecord) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fadeIn">
        {/* Score Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white shadow-2xl text-center relative overflow-hidden">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
            <Trophy className="w-9 h-9 text-amber-300" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            สรุปผลคะแนนแบบฝึกหัด
          </h2>
          <p className="text-indigo-200 text-xs mt-1">
            {getOpLabel(scoreRecord.operation)} • ระดับ {getDiffLabel(scoreRecord.difficulty)}
          </p>

          {/* Big Score Display */}
          <div className="my-6 inline-flex flex-col items-center px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <span className="text-5xl font-extrabold font-mono text-amber-300">
              {scoreRecord.score} / {scoreRecord.totalQuestions}
            </span>
            <span className="text-sm font-semibold text-indigo-100 mt-1">
              คิดเป็น {scoreRecord.percentage}%
            </span>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={startQuiz}
              className="px-5 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs shadow-md hover:bg-indigo-50 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> ทำแบบฝึกหัดอีกครั้ง
            </button>
            <button
              onClick={onFinishQuiz}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Trophy className="w-4 h-4" /> ดูตารางอันดับคะแนน
            </button>
          </div>
        </div>

        {/* Detailed Solutions Breakdown */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" /> เฉลยกระบวนการคิดอย่างละเอียดทุกข้อ
          </h3>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const userAnsStr = answers[q.id];
              const isCorrect = userAnsStr !== undefined && parseInt(userAnsStr, 10) === q.correctAnswer;

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border ${
                    isCorrect
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                      : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      ข้อที่ {idx + 1}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                        isCorrect
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {isCorrect ? 'ถูกต้อง' : 'ตอบผิด'}
                    </span>
                  </div>

                  <p className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1">
                    {q.expressionDisplay}
                  </p>

                  <div className="text-xs font-mono mb-3 flex gap-4 text-slate-600 dark:text-slate-400">
                    <span>ตอบของคุณ: <strong>{userAnsStr || '-'}</strong></span>
                    <span>เฉลยที่ถูกต้อง: <strong className="text-emerald-600 dark:text-emerald-400">{q.correctAnswer}</strong></span>
                  </div>

                  {/* Step explanations */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                      วิธีคิดอย่างละเอียด:
                    </span>
                    {q.explanationSteps.map((step, sIdx) => (
                      <p key={sIdx} className="text-slate-700 dark:text-slate-300">
                        • {step}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // If Quiz setup screen
  if (!isQuizStarted) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fadeIn">
        {/* Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
              <Calculator className="w-6 h-6 text-amber-300" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
              ระบบแบบฝึกหัด (Interactive Quiz & Practice)
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            ตั้งค่าแบบฝึกหัดการคูณและการหาร
          </h2>
          <p className="mt-1 text-indigo-100 text-sm">
            เลือกประเภทการกระทำ ระดับความยาก และสุ่มโจทย์ท้าทายความสามารถ พร้อมระบบสถิติคะแนน
          </p>
        </div>

        {/* Selection Form */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
          {/* 1. Operation Selection Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              1. เลือกเรื่องที่ต้องการทำ:
            </label>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value as OperationType)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition cursor-pointer"
            >
              <option value="multiplication">การคูณ (×)</option>
              <option value="division">การหาร (÷)</option>
              <option value="mixed">ผสมคูณและหาร</option>
              <option value="puzzle">โจทย์ทายจำนวน</option>
            </select>
          </div>

          {/* 2. Difficulty Level Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              2. เลือกระดับความยาก:
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition cursor-pointer"
            >
              <option value="easy">ง่าย (ตัวเลข 1 หลัก : ช่วง -10 ถึง 10)</option>
              <option value="medium">ปานกลาง (ตัวเลข 2 หลัก : ช่วง -25 ถึง 25)</option>
              <option value="hard">ยาก / มีวงเล็บ [ ] (มีวงเล็บซ้อนและหลายขั้นตอน)</option>
            </select>
          </div>

          {/* 3. Question Count Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              3. จำนวนข้อสอบ:
            </label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition cursor-pointer"
            >
              <option value={5}>5 ข้อ</option>
              <option value={10}>10 ข้อ</option>
              <option value={15}>15 ข้อ</option>
              <option value={20}>20 ข้อ</option>
            </select>
          </div>

          {/* Start Quiz Button */}
          <button
            onClick={startQuiz}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-base shadow-lg shadow-emerald-500/30 transition transform active:scale-98 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>เริ่มทำแบบฝึกหัด (Start Practice)</span>
          </button>
        </div>
      </div>
    );
  }

  // Active Quiz View
  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-4 pb-12 animate-fadeIn">
      {/* Quiz Progress Header */}
      <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold font-mono flex items-center justify-center text-sm">
            {currentIndex + 1}
          </span>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            ข้อที่ {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-28 sm:w-48 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 1. โจทย์ (Question Display) */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-center space-y-2">
        <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          {getOpLabel(currentQ.operationType)} • ระดับ {getDiffLabel(difficulty)}
        </div>

        <div className="py-3 px-4 sm:py-5 sm:px-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-inner">
          <p className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 dark:text-slate-100 tracking-wider">
            {currentQ.expressionDisplay}
          </p>
        </div>
      </div>

      {/* 2. แป้นกดดิจิทัล (Digital Keypad) - แสดงขณะยังไม่ได้ส่งคำตอบ */}
      {!showExplanation ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3.5 shadow-md">
          <DigitalKeypad
            value={currentInput}
            onChange={setCurrentInput}
            onSubmit={handleKeypadSubmit}
            disabled={showExplanation}
          />
        </div>
      ) : (
        /* 3. คำอธิบาย & 4. ปุ่มข้อถัดไป (แสดงแทนที่แป้นกดเมื่อส่งคำตอบแล้ว) */
        <div className="space-y-3 animate-fadeIn">
          {/* 3. คำอธิบาย */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border ${
              parseInt(currentInput, 10) === currentQ.correctAnswer
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm mb-1">
              {parseInt(currentInput, 10) === currentQ.correctAnswer ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>คำตอบถูกต้อง! (+1 คะแนน)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>คำตอบยังไม่ถูกต้อง (ตอบ: {currentInput} | เฉลย: {currentQ.correctAnswer})</span>
                </>
              )}
            </div>
            <div className="text-xs space-y-1 font-sans mt-2">
              <span className="font-bold block text-slate-700 dark:text-slate-300">
                แนวทางคำนวณ:
              </span>
              {currentQ.explanationSteps.map((st, i) => (
                <p key={i}>• {st}</p>
              ))}
            </div>
          </div>

          {/* 4. ปุ่มข้อถัดไป */}
          <button
            onClick={handleNextQuestion}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition transform active:scale-98"
          >
            <span>{currentIndex < questions.length - 1 ? 'ข้อถัดไป' : 'สรุปผลคะแนน'}</span>
            <span className="hidden sm:inline-flex items-center text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/20 text-indigo-100 font-semibold ml-1">
              ↵ Enter
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
