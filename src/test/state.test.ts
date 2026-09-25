import { describe, expect, it } from 'vitest';
import { DAYS } from '../content/program';
import {
  cycleTotals,
  dayReps,
  dayStats,
  dayTonnage,
  lastPerf,
  nextDay,
  restDurationForExercise,
  setKey,
  workoutReducer,
  emptyState,
} from '../domain/state';

describe('workout state', () => {
  it('counts planned and completed sets for a day', () => {
    const state = workoutReducer(emptyState(), {
      type: 'toggle-set', day: 1, exercise: 0, set: 1, weight: 60, reps: 10, at: 1,
    });
    expect(dayStats(state, 1)).toEqual({ done: 1, total: DAYS[0].ex.reduce((sum, item) => sum + item.s, 0) });
    expect(nextDay(state)).toBe(1);
  });

  it('keeps decimal tonnage and repetition totals', () => {
    let state = emptyState();
    state = workoutReducer(state, { type: 'toggle-set', day: 1, exercise: 0, set: 1, weight: 1.25, reps: 1, at: 1 });
    state = workoutReducer(state, { type: 'toggle-set', day: 1, exercise: 0, set: 2, weight: 1.25, reps: 2, at: 2 });
    expect(dayTonnage(state, 1)).toBe(3.75);
    expect(dayReps(state, 1)).toBe(3);
  });

  it('stores weights and reps before completion', () => {
    let state = emptyState();
    state = workoutReducer(state, { type: 'set-weight', day: 1, exercise: 0, set: 1, weight: 62.5 });
    state = workoutReducer(state, { type: 'set-reps', day: 1, exercise: 0, set: 1, reps: 9 });
    expect(state.days['1']?.sets[setKey(0, 1)]).toEqual({ done: false, w: 62.5, r: 9 });
  });

  it('returns the next unfinished day and aggregate totals', () => {
    let state = emptyState();
    state = workoutReducer(state, { type: 'toggle-set', day: 1, exercise: 0, set: 1, weight: 60, reps: 10, at: 1 });
    expect(cycleTotals(state)).toEqual({ tonn: 600, sets: 1, days: 0 });
    const allSets = Array.from({ length: DAYS[0].ex.length }, (_, exercise) => ({ exercise, sets: DAYS[0].ex[exercise].s }));
    for (const { exercise, sets } of allSets) {
      for (let set = 1; set <= sets; set += 1) state = workoutReducer(state, { type: 'toggle-set', day: 1, exercise, set, weight: 60, reps: 10, at: 1 });
    }
    state = workoutReducer(state, { type: 'finish-day', day: 1, at: 2 });
    expect(nextDay(state)).toBe(2);
    expect(cycleTotals(state).days).toBe(1);
  });

  it('returns the previous individual performance pairs', () => {
    let state = emptyState();
    state = workoutReducer(state, { type: 'toggle-set', day: 1, exercise: 0, set: 1, weight: 60, reps: 10, at: 1 });
    state = workoutReducer(state, { type: 'toggle-set', day: 1, exercise: 0, set: 2, weight: 62.5, reps: 9, at: 1 });
    expect(lastPerf(state, DAYS[0].ex[0].name, 1)).toBeNull();
    const nextDayState = workoutReducer(state, { type: 'toggle-set', day: 2, exercise: 0, set: 1, weight: 10, reps: 1, at: 1 });
    expect(lastPerf(nextDayState, DAYS[0].ex[0].name, 2)?.pairs).toEqual([{ w: 60, r: 10 }, { w: 62.5, r: 9 }]);
  });

  it('chooses rest duration from exercise position and rep ceiling', () => {
    expect(restDurationForExercise(0, { name: 'x', url: '', s: 3, min: 6, max: 12 })).toBe(180);
    expect(restDurationForExercise(1, { name: 'x', url: '', s: 3, min: 6, max: 12 })).toBe(150);
    expect(restDurationForExercise(1, { name: 'x', url: '', s: 3, min: 8, max: 15 })).toBe(120);
  });
});
