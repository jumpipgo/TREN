import { describe, expect, it } from 'vitest';
import { DAYS } from '../content/program';
import { HELP } from '../content/help';

describe('program content', () => {
  it('contains 12 numbered training days', () => {
    expect(DAYS).toHaveLength(12);
    expect(DAYS.map((day) => day.n)).toEqual(Array.from({ length: 12 }, (_, index) => index + 1));
  });

  it('has valid exercise URLs and set ranges', () => {
    for (const day of DAYS) {
      for (const exercise of day.ex) {
        expect(exercise.name.length).toBeGreaterThan(3);
        expect(exercise.url).toMatch(/^https:\/\//);
        expect(exercise.s).toBeGreaterThan(0);
        expect(exercise.min).toBeGreaterThan(0);
        expect(exercise.max).toBeGreaterThanOrEqual(exercise.min);
      }
    }
  });

  it('has help for every interactive topic', () => {
    for (const key of ['progress', 'scheme', 'weight', 'reps', 'check', 'last', 'tonnage', 'rest', 'pr']) {
      expect(HELP[key as keyof typeof HELP]).toBeTruthy();
    }
  });
});
