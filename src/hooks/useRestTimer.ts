import { useCallback, useEffect, useRef, useState } from 'react';
import { formatClock, vibrate } from '../utils/format';

interface RestTimerState {
  total: number;
  left: number;
  running: boolean;
  shown: boolean;
  over: boolean;
}

function beep(): void {
  try {
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    const context = beep.context ?? new AudioContextClass();
    beep.context = context;
    const now = context.currentTime;
    [
      [784, 0],
      [988, 0.18],
    ].forEach(([frequency, delay]) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.28, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.17);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now + delay);
      oscillator.stop(now + delay + 0.2);
    });
  } catch {
    // Audio may be blocked until the first user gesture.
  }
}
beep.context = null as AudioContext | null;

export function useRestTimer() {
  const [state, setState] = useState<RestTimerState>({
    total: 0,
    left: 0,
    running: false,
    shown: false,
    over: false,
  });
  const endAt = useRef(0);
  const total = useRef(0);
  const interval = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (interval.current != null) window.clearInterval(interval.current);
    interval.current = null;
  }, []);

  const tick = useCallback(() => {
    const left = Math.max(0, (endAt.current - Date.now()) / 1000);
    setState((current) => ({ ...current, left }));
    if (left <= 0) {
      clear();
      setState((current) => ({ ...current, left: 0, running: false, over: true }));
      vibrate([150, 80, 150]);
      beep();
    }
  }, [clear]);

  const startInterval = useCallback(() => {
    clear();
    interval.current = window.setInterval(tick, 200);
  }, [clear, tick]);

  const start = useCallback(
    (seconds: number) => {
      total.current = seconds;
      endAt.current = Date.now() + seconds * 1000;
      setState({ total: seconds, left: seconds, running: true, shown: true, over: false });
      startInterval();
    },
    [startInterval],
  );

  const addThirty = useCallback(() => {
    if (!state.shown || !state.running || state.left <= 0) {
      start(30);
      return;
    }
    endAt.current += 30_000;
    setState((current) => ({ ...current, total: Math.max(total.current, current.left + 30), over: false }));
  }, [start, state.left, state.running, state.shown]);

  const togglePause = useCallback(() => {
    setState((current) => {
      if (current.running) {
        const left = Math.max(0, (endAt.current - Date.now()) / 1000);
        clear();
        return { ...current, left, running: false };
      }
      if (current.left > 0) {
        endAt.current = Date.now() + current.left * 1000;
        startInterval();
        return { ...current, running: true };
      }
      return current;
    });
  }, [clear, startInterval]);

  const close = useCallback(() => {
    clear();
    total.current = 0;
    endAt.current = 0;
    setState({ total: 0, left: 0, running: false, shown: false, over: false });
  }, [clear]);

  useEffect(() => clear, [clear]);

  return { ...state, display: formatClock(Math.ceil(state.left)), start, addThirty, togglePause, close };
}
