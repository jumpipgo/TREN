import { DAYS } from '../content/program';
import type {
  AppState,
  CycleTotals,
  DayRecord,
  DayStats,
  Exercise,
  LastPerformance,
  SetRecord,
  Theme,
} from './types';

export const setKey = (exercise: number, set: number) => `${exercise}:${set}`;

export const emptyState = (): AppState => ({ days: {}, theme: 'dark' });

export const emptyDay = (): DayRecord => ({
  sets: {},
  finished: false,
  startedAt: null,
  finishedAt: null,
});

export function normalizeState(raw: unknown): AppState {
  const state = emptyState();
  if (!raw || typeof raw !== 'object') return state;

  const candidate = raw as Partial<AppState>;
  if (candidate.theme === 'dark' || candidate.theme === 'light') {
    state.theme = candidate.theme;
  }
  if (!candidate.days || typeof candidate.days !== 'object') return state;

  for (const [key, value] of Object.entries(candidate.days)) {
    if (!/^([1-9]|1[0-2])$/.test(key) || !value || typeof value !== 'object') continue;
    const source = value as Partial<DayRecord>;
    const day = emptyDay();
    day.finished = Boolean(source.finished);
    day.startedAt = Number.isFinite(source.startedAt) ? Number(source.startedAt) : null;
    day.finishedAt = Number.isFinite(source.finishedAt) ? Number(source.finishedAt) : null;

    if (source.sets && typeof source.sets === 'object') {
      for (const [recordKey, record] of Object.entries(source.sets)) {
        if (!/^\d+:[1-9]\d*$/.test(recordKey) || !record || typeof record !== 'object') continue;
        const sourceSet = record as Partial<SetRecord>;
        const rawWeight = sourceSet.w == null ? null : Number(sourceSet.w);
        const rawReps = sourceSet.r == null ? null : Number(sourceSet.r);
        day.sets[recordKey] = {
          done: Boolean(sourceSet.done),
          w: Number.isFinite(rawWeight) && Number(rawWeight) >= 0 ? Number(rawWeight) : null,
          r: Number.isFinite(rawReps) && Number(rawReps) >= 0 ? Math.floor(Number(rawReps)) : null,
        };
      }
    }

    const stats = dayStatsFromRecord(key, day);
    if (day.finished && stats.done < stats.total) day.finished = false;
    state.days[key] = day;
  }

  return state;
}

export type StateAction =
  | { type: 'set-weight'; day: number; exercise: number; set: number; weight: number | null }
  | { type: 'set-reps'; day: number; exercise: number; set: number; reps: number | null }
  | {
      type: 'toggle-set';
      day: number;
      exercise: number;
      set: number;
      weight: number | null;
      reps: number | null;
      at: number;
    }
  | { type: 'finish-day'; day: number; at: number }
  | { type: 'reset-days' }
  | { type: 'replace-state'; state: AppState }
  | { type: 'set-theme'; theme: Theme };

function updateSet(
  state: AppState,
  dayNumber: number,
  exercise: number,
  set: number,
  update: (record: SetRecord) => SetRecord,
): AppState {
  const dayKey = String(dayNumber);
  const currentDay = state.days[dayKey] ?? emptyDay();
  const key = setKey(exercise, set);
  const currentSet = currentDay.sets[key] ?? { done: false, w: null, r: null };
  return {
    ...state,
    days: {
      ...state.days,
      [dayKey]: {
        ...currentDay,
        sets: { ...currentDay.sets, [key]: update(currentSet) },
      },
    },
  };
}

export function workoutReducer(state: AppState, action: StateAction): AppState {
  switch (action.type) {
    case 'set-weight':
      return updateSet(state, action.day, action.exercise, action.set, (record) => ({
        ...record,
        w: action.weight && action.weight > 0 ? action.weight : null,
      }));
    case 'set-reps':
      return updateSet(state, action.day, action.exercise, action.set, (record) => ({
        ...record,
        r: action.reps,
      }));
    case 'toggle-set': {
      const existing = getSet(state, action.day, action.exercise, action.set);
      if (existing?.done) {
        return updateSet(state, action.day, action.exercise, action.set, (record) => ({
          ...record,
          done: false,
        }));
      }
      return updateSet(state, action.day, action.exercise, action.set, (record) => ({
        ...record,
        done: true,
        w: action.weight,
        r: action.reps,
      }));
    }
    case 'finish-day': {
      const dayKey = String(action.day);
      const day = state.days[dayKey] ?? emptyDay();
      return {
        ...state,
        days: {
          ...state.days,
          [dayKey]: { ...day, finished: true, finishedAt: action.at },
        },
      };
    }
    case 'reset-days':
      return { ...state, days: {} };
    case 'replace-state':
      return action.state;
    case 'set-theme':
      return { ...state, theme: action.theme };
  }
}

export function getDay(state: AppState, day: number): DayRecord | undefined {
  return state.days[String(day)];
}

export function getSet(
  state: AppState,
  day: number,
  exercise: number,
  set: number,
): SetRecord | undefined {
  return getDay(state, day)?.sets[setKey(exercise, set)];
}

function dayStatsFromRecord(dayNumber: string, record: DayRecord): DayStats {
  const day = DAYS[Number(dayNumber) - 1];
  if (!day) return { done: 0, total: 0 };
  let done = 0;
  let total = 0;
  day.ex.forEach((exercise, exerciseIndex) => {
    total += exercise.s;
    for (let set = 1; set <= exercise.s; set += 1) {
      if (record.sets[setKey(exerciseIndex, set)]?.done) done += 1;
    }
  });
  return { done, total };
}

export function dayStats(state: AppState, dayNumber: number): DayStats {
  return dayStatsFromRecord(String(dayNumber), getDay(state, dayNumber) ?? emptyDay());
}

export function dayTonnage(state: AppState, dayNumber: number): number {
  const day = getDay(state, dayNumber);
  const program = DAYS[dayNumber - 1];
  if (!day || !program) return 0;
  let total = 0;
  program.ex.forEach((exercise, exerciseIndex) => {
    for (let set = 1; set <= exercise.s; set += 1) {
      const record = day.sets[setKey(exerciseIndex, set)];
      if (record?.done && record.w && record.w > 0 && record.r && record.r > 0) {
        total += record.w * record.r;
      }
    }
  });
  return total;
}

export function dayIncompleteSets(state: AppState, dayNumber: number): number {
  const day = getDay(state, dayNumber);
  const program = DAYS[dayNumber - 1];
  if (!day || !program) return 0;
  let total = 0;
  program.ex.forEach((exercise, exerciseIndex) => {
    for (let set = 1; set <= exercise.s; set += 1) {
      const record = day.sets[setKey(exerciseIndex, set)];
      if (record?.done && !(record.w != null && record.w > 0 && record.r != null && record.r > 0)) {
        total += 1;
      }
    }
  });
  return total;
}

export function dayReps(state: AppState, dayNumber: number): number {
  const day = getDay(state, dayNumber);
  const program = DAYS[dayNumber - 1];
  if (!day || !program) return 0;
  let total = 0;
  program.ex.forEach((exercise, exerciseIndex) => {
    for (let set = 1; set <= exercise.s; set += 1) {
      const record = day.sets[setKey(exerciseIndex, set)];
      if (record?.done && record.r && record.r > 0) total += record.r;
    }
  });
  return total;
}

export function cycleTotals(state: AppState): CycleTotals {
  return DAYS.reduce(
    (totals, _, index) => {
      const day = index + 1;
      if (getDay(state, day)?.finished) totals.days += 1;
      totals.tonn += dayTonnage(state, day);
      totals.sets += dayStats(state, day).done;
      return totals;
    },
    { tonn: 0, sets: 0, days: 0 } as CycleTotals,
  );
}

export function nextDay(state: AppState): number | null {
  for (let day = 1; day <= DAYS.length; day += 1) {
    if (!getDay(state, day)?.finished) return day;
  }
  return null;
}

export const allDone = (state: AppState) => nextDay(state) === null;

/**
 * Вес для подсказки в поле ввода: ближайший уже заполненный вес выше по списку
 * внутри того же упражнения (подходы идут 1, 2, 3 — берём последний непустой назад).
 * Это ровно тот вес, который пользователь поставил в предыдущей строке,
 * поэтому переносить его дальше безопасно.
 */
export function carryWeight(state: AppState, day: number, exercise: number, set: number): number | null {
  for (let index = set - 1; index >= 1; index -= 1) {
    const weight = getSet(state, day, exercise, index)?.w;
    if (weight != null && weight > 0) return weight;
  }
  return null;
}

export function lastPerf(state: AppState, name: string, beforeDay: number): LastPerformance | null {
  for (let dayNumber = beforeDay - 1; dayNumber >= 1; dayNumber -= 1) {
    const programDay = DAYS[dayNumber - 1];
    const exerciseIndex = programDay.ex.findIndex((exercise) => exercise.name === name);
    if (exerciseIndex < 0) continue;
    const record = getDay(state, dayNumber);
    if (!record) continue;

    const pairs: LastPerformance['pairs'] = [];
    let lastWeight: number | null = null;
    for (let set = 1; set <= programDay.ex[exerciseIndex].s; set += 1) {
      const setRecord = record.sets[setKey(exerciseIndex, set)];
      if (!setRecord?.done) continue;
      pairs.push({ w: setRecord.w, r: setRecord.r });
      if (setRecord.w != null) lastWeight = setRecord.w;
    }
    if (pairs.length) return { w: lastWeight, pairs };
  }
  return null;
}

export function progressionExercises(state: AppState, dayNumber: number): string[] {
  const day = DAYS[dayNumber - 1];
  const result: string[] = [];
  day.ex.forEach((exercise, exerciseIndex) => {
    const allMax = Array.from({ length: exercise.s }, (_, index) => index + 1).every((set) => {
      const record = getSet(state, dayNumber, exerciseIndex, set);
      return Boolean(record?.done && record.r && record.r >= exercise.max);
    });
    if (allMax) result.push(exercise.name);
  });
  return result;
}

export function restDurationForExercise(exerciseIndex: number, exercise: Exercise): number {
  if (exerciseIndex === 0) return 180;
  return exercise.max <= 12 ? 150 : 120;
}
