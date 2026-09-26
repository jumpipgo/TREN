import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { loadState, saveState } from './storage';
import { workoutReducer } from './state';
import type { AppState, Theme } from './types';

interface MesoContextValue {
  state: AppState;
  recovered: boolean;
  setWeight: (day: number, exercise: number, set: number, weight: number | null) => void;
  setReps: (day: number, exercise: number, set: number, reps: number | null) => void;
  toggleSet: (
    day: number,
    exercise: number,
    set: number,
    weight: number | null,
    reps: number | null,
  ) => void;
  finishDay: (day: number) => void;
  resetDays: () => void;
  replaceState: (state: AppState) => void;
  setTheme: (theme: Theme) => void;
}

const initial = typeof window === 'undefined'
  ? { state: { days: {}, theme: 'dark' as const }, recovered: false }
  : loadState(window.localStorage);

const MesoContext = createContext<MesoContextValue | null>(null);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workoutReducer, initial.state);

  useEffect(() => {
    saveState(window.localStorage, state);
    document.documentElement.dataset.theme = state.theme;
    const themeColor = state.theme === 'dark' ? '#000000' : '#F2F5F4';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
  }, [state]);

  const setWeight = useCallback(
    (day: number, exercise: number, set: number, weight: number | null) =>
      dispatch({ type: 'set-weight', day, exercise, set, weight }),
    [],
  );
  const setReps = useCallback(
    (day: number, exercise: number, set: number, reps: number | null) =>
      dispatch({ type: 'set-reps', day, exercise, set, reps }),
    [],
  );
  const toggleSet = useCallback(
    (day: number, exercise: number, set: number, weight: number | null, reps: number | null) =>
      dispatch({ type: 'toggle-set', day, exercise, set, weight, reps, at: Date.now() }),
    [],
  );
  const finishDay = useCallback((day: number) => {
    dispatch({ type: 'finish-day', day, at: Date.now() });
  }, []);
  const resetDays = useCallback(() => dispatch({ type: 'reset-days' }), []);
  const replaceState = useCallback((nextState: AppState) => dispatch({ type: 'replace-state', state: nextState }), []);
  const setTheme = useCallback((theme: Theme) => dispatch({ type: 'set-theme', theme }), []);

  const value = useMemo(
    () => ({ state, recovered: initial.recovered, setWeight, setReps, toggleSet, finishDay, resetDays, replaceState, setTheme }),
    [state, setWeight, setReps, toggleSet, finishDay, resetDays, replaceState, setTheme],
  );

  return <MesoContext.Provider value={value}>{children}</MesoContext.Provider>;
}

export function useWorkout(): MesoContextValue {
  const context = useContext(MesoContext);
  if (!context) throw new Error('useWorkout must be used inside MesoContext');
  return context;
}
