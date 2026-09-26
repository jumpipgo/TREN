import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

const ACCESS_KEY = 'meso.access.v1';
const ITERATIONS = 120_000;
const SALT_BYTES = 16;

type AccessStatus = 'loading' | 'setup' | 'locked' | 'unlocked';

interface PinRecord {
  salt: string;
  hash: string;
  iterations: number;
}

interface AccessContextValue {
  status: AccessStatus;
  hasPin: boolean;
  setPin: (pin: string) => Promise<void>;
  unlock: (pin: string) => Promise<void>;
  lock: () => void;
}

const AccessContext = createContext<AccessContextValue | null>(null);

function encode(value: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(value)));
}

function decode(value: string): Uint8Array {
  return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}

function readRecord(): PinRecord | null {
  try {
    const raw = window.localStorage.getItem(ACCESS_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw) as Partial<PinRecord>;
    if (typeof record.salt !== 'string' || typeof record.hash !== 'string' || typeof record.iterations !== 'number' || !Number.isFinite(record.iterations)) return null;
    return { salt: record.salt, hash: record.hash, iterations: record.iterations };
  } catch {
    return null;
  }
}

async function derivePin(pin: string, salt: ArrayBuffer, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    key,
    256,
  );
  return encode(bits);
}

function equalHash(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AccessStatus>('loading');
  const [hasPin, setHasPin] = useState(false);

  useEffect(() => {
    const record = readRecord();
    setHasPin(Boolean(record));
    setStatus(record ? 'locked' : 'setup');
  }, []);

  const setPin = useCallback(async (pin: string) => {
    if (!isValidPin(pin)) throw new Error('PIN должен содержать от 4 до 6 цифр');
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const iterations = ITERATIONS;
    const hash = await derivePin(pin, salt.buffer as ArrayBuffer, iterations);
    const record: PinRecord = { salt: encode(salt.buffer), hash, iterations };
    window.localStorage.setItem(ACCESS_KEY, JSON.stringify(record));
    setHasPin(true);
    setStatus('unlocked');
  }, []);

  const unlock = useCallback(async (pin: string) => {
    const record = readRecord();
    if (!record || !isValidPin(pin)) throw new Error('Неверный PIN');
    const hash = await derivePin(pin, decode(record.salt).buffer as ArrayBuffer, record.iterations);
    if (!equalHash(hash, record.hash)) throw new Error('Неверный PIN');
    setStatus('unlocked');
  }, []);

  const lock = useCallback(() => {
    if (readRecord()) setStatus('locked');
  }, []);

  useEffect(() => {
    let hiddenAt = 0;
    const onVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }
      if (status === 'unlocked' && hiddenAt && Date.now() - hiddenAt > 5 * 60 * 1000) {
        setStatus('locked');
      }
      hiddenAt = 0;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [status]);

  return (
    <AccessContext.Provider value={{ status, hasPin, setPin, unlock, lock }}>
      {children}
    </AccessContext.Provider>
  );
}

export function useAccess(): AccessContextValue {
  const context = useContext(AccessContext);
  if (!context) throw new Error('useAccess must be used inside AccessProvider');
  return context;
}
