import { emptyState, normalizeState } from './state';
import type { AppState } from './types';

export const STORAGE_KEY = 'meso.classic-split.v1';

export interface StorageResult {
  state: AppState;
  recovered: boolean;
}

export function loadState(storage: Pick<Storage, 'getItem'>): StorageResult {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return { state: raw ? normalizeState(JSON.parse(raw)) : emptyState(), recovered: false };
  } catch {
    return { state: emptyState(), recovered: true };
  }
}

export function saveState(storage: Pick<Storage, 'setItem'>, state: AppState): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.warn('Не удалось сохранить журнал тренировок', error);
    return false;
  }
}
