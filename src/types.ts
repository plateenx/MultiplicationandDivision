export type OperationType = 'multiplication' | 'division' | 'mixed' | 'puzzle';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type GameCategory = 'multiplication' | 'division' | 'mixed' | 'speed';

export interface User {
  username: string;
  name: string;
  surname: string;
  grade?: number | string;
  room?: number | string;
  studentNo?: number | string;
  email: string;
  registeredAt: string;
}

export interface ScoreRecord {
  id: string;
  username: string;
  fullName: string;
  grade?: number | string;
  room?: number | string;
  studentNo?: number | string;
  operation: OperationType;
  difficulty: DifficultyLevel;
  score: number;
  totalQuestions: number;
  percentage: number;
  timestamp: string;
  details?: string;
}

export interface GameResultData {
  score: number;
  correctCount?: number;
  totalQuestions?: number;
  accuracyPercentage?: number;
  maxCombo?: number;
  timeSpentSeconds?: number;
  details?: string;
  specialMetrics?: Record<string, string | number | boolean>;
}

export interface GameRecord {
  id: string;
  username: string;
  fullName: string;
  grade?: number | string;
  room?: number | string;
  studentNo?: number | string;
  gameId: string;
  gameTitle: string;
  gameCategory: GameCategory;
  score: number;
  highScore?: number;
  correctCount: number;
  totalQuestions: number;
  accuracyPercentage: number;
  maxCombo: number;
  timeSpentSeconds: number;
  details: string;
  specialMetrics?: Record<string, string | number | boolean>;
  timestamp: string;
}

export interface GameSummaryStats {
  totalGamesPlayed: number;
  totalGameScore: number;
  highestSingleScore: number;
  topGameTitle: string;
  averageAccuracy: number;
  totalCorrectAnswers: number;
}

export interface UserLog {
  id: string;
  username: string;
  fullName: string;
  grade?: number | string;
  room?: number | string;
  studentNo?: number | string;
  action: 'SIGN_IN' | 'SIGN_OUT';
  timestamp: string;
  device?: string;
}

export interface SessionSummary {
  username: string;
  fullName: string;
  totalSessions: number;
  totalDurationSeconds: number; // Sum of closed sessions
  lastSignIn: string;
  isOnline: boolean;
  currentSessionStart?: string;
  activeDurationSeconds?: number;
}

export interface Question {
  id: number;
  num1: number;
  num2: number;
  operationSymbol: '×' | '÷';
  operationType: 'multiplication' | 'division';
  expressionDisplay: string;
  correctAnswer: number;
  explanationSteps: string[];
  hint?: string;
}

export interface SupabaseSettings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  soundEnabled: boolean;
  theme: 'light' | 'dark';
}

