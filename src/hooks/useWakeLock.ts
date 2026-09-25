import { useCallback, useEffect, useRef } from 'react';

export function useWakeLock() {
  const lock = useRef<WakeLockSentinel | null>(null);

  const request = useCallback(async () => {
    try {
      if (!lock.current && navigator.wakeLock) {
        lock.current = await navigator.wakeLock.request('screen');
      }
    } catch {
      // Wake Lock can be denied in background or unsupported browsers.
    }
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void request();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      void lock.current?.release();
      lock.current = null;
    };
  }, [request]);

  return request;
}
