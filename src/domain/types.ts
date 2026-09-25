export interface Exercise {
  name: string;
  url: string;
  s: number;
  min: number;
  max: number;
}

export interface TrainingDay {
  n: number;
  goal: string;
  notes: string[];
  ex: Exercise[];
}

export type Theme = 'dark' | 'light';
export type Screen = 'home' | 'cycle' | 'day';

export interface SetRecord {
  done: boolean;
  w: number | null;
  r: number | null;
}

export interface DayRecord {
  sets: Record<string, SetRecord>;
  finished: boolean;
  startedAt: number | null;
  finishedAt: number | null;
}

export interface AppState {
  days: Record<string, DayRecord>;
  theme: Theme;
}

export interface DayStats {
  done: number;
  total: number;
}

export interface CycleTotals {
  tonn: number;
  sets: number;
  days: number;
}

export interface LastPair {
  w: number | null;
  r: number | null;
}

export interface LastPerformance {
  w: number | null;
  pairs: LastPair[];
}

export type HelpKey =
  | 'progress'
  | 'scheme'
  | 'weight'
  | 'reps'
  | 'check'
  | 'last'
  | 'tonnage'
  | 'rest'
  | 'pr';

export interface SummaryData {
  day: number;
  tonnage: number;
  done: number;
  total: number;
  reps: number;
  time: string;
  progression: string[];
}
