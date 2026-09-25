import { describe, expect, it } from 'vitest';
import { loadState, saveState, STORAGE_KEY } from '../domain/storage';
import { emptyState } from '../domain/state';

describe('storage adapter', () => {
  it('round-trips a state object', () => {
    const state = { ...emptyState(), theme: 'light' as const };
    expect(saveState(localStorage, state)).toBe(true);
    expect(loadState(localStorage).state).toEqual(state);
  });

  it('recovers from malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{broken');
    const result = loadState(localStorage);
    expect(result.recovered).toBe(true);
    expect(result.state).toEqual(emptyState());
  });

  it('normalizes invalid and partially completed records', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      theme: 'light',
      days: {
        '1': { sets: { '0:1': { done: true, w: '60', r: 10.8 } }, finished: true },
        '13': { sets: {} },
        'bad': { sets: {} },
      },
    }));
    const state = loadState(localStorage).state;
    expect(state.theme).toBe('light');
    expect(state.days['1']?.sets['0:1']).toEqual({ done: true, w: 60, r: 10 });
    expect(state.days['1']?.finished).toBe(false);
    expect(state.days['13']).toBeUndefined();
  });
});
