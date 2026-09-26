import { useState, type ReactNode } from 'react';
import { isValidPin, useAccess } from '../domain/access';
import { vibrate } from '../utils/format';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'gap', '0', 'del'];
const MAX = 6;

type Phase = 'enter' | 'repeat';

/**
 * Ввод PIN на собственном пульте, без системной клавиатуры.
 *
 * Четыре-шесть цифр не стоят того, чтобы поднимать клавиатуру на пол-экрана.
 * Своя панель не сдвигает вёрстку, ничего не подсказывает и работает в
 * перчатках. Скрытое поле остаётся в DOM: с него читает экранный диктор,
 * с него же принимается ввод с физической клавиатуры на десктопе.
 */
export function AccessGate({ children }: { children: ReactNode }) {
  const { status, setPin, unlock } = useAccess();
  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [phase, setPhase] = useState<Phase>('enter');
  const [error, setError] = useState('');

  if (status === 'loading') {
    return <main className="access-screen"><div className="access-card"><b>МЕЗО</b><span>Проверка доступа…</span></div></main>;
  }

  if (status === 'unlocked') return <>{children}</>;

  const setup = status === 'setup';
  const active = phase === 'enter' ? pin : confirmPin;

  function reset() {
    setPinValue('');
    setConfirmPin('');
    setPhase('enter');
    setError('');
  }

  function press(key: string) {
    setError('');
    if (key === 'del') {
      vibrate(8);
      // Функциональная форма обязательна: при быстрых тапах по пульту
      // значение из замыкания успевает устареть, и цифры теряются.
      if (phase === 'repeat') {
        setConfirmPin((current) => {
          if (!current) { setPhase('enter'); return current; }
          return current.slice(0, -1);
        });
        return;
      }
      setPinValue((current) => current.slice(0, -1));
      return;
    }
    if (key === 'gap' || !key) return;
    if (active.length >= MAX) return;
    vibrate(10);
    if (phase === 'enter') setPinValue((current) => (current + key).slice(0, MAX));
    else setConfirmPin((current) => (current + key).slice(0, MAX));
  }

  /** Ввод с физической клавиатуры — только на десктопе. */
  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (/^\d$/.test(event.key)) {
      press(event.key);
      return;
    }
    if (event.key === 'Backspace') {
      event.preventDefault();
      press('del');
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      void submit();
    }
  }

  async function submit() {
    setError('');
    if (setup) {
      if (phase === 'enter') {
        if (!isValidPin(pin)) { setError('Нужно от 4 до 6 цифр'); return; }
        setPhase('repeat');
        return;
      }
      if (pin !== confirmPin) { setError('PIN-коды не совпадают'); reset(); return; }
      try {
        await setPin(pin);
        setPinValue('');
        setConfirmPin('');
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Не удалось создать PIN');
        reset();
      }
      return;
    }
    if (!isValidPin(pin)) { setError('Нужно от 4 до 6 цифр'); return; }
    try {
      await unlock(pin);
      setPinValue('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Неверный PIN');
      setPinValue('');
    }
  }

  const canSubmit = isValidPin(phase === 'enter' ? pin : confirmPin);

  return (
    <main className="access-screen">
      <div className="access-card">
        <b>МЕЗО</b>
        <h1>{setup ? (phase === 'enter' ? 'Создай PIN-код' : 'Повтори PIN-код') : 'Введи PIN-код'}</h1>
        <p>
          {!setup && 'Для продолжения нужен ваш PIN-код.'}
          {setup && phase === 'enter' && 'Защити журнал локальным кодом доступа.'}
          {setup && phase === 'repeat' && 'Введи те же цифры ещё раз.'}
        </p>

        <input
          id="meso-pin"
          className="pin-hidden"
          type="password"
          inputMode="none"
          readOnly
          onKeyDown={onKeyDown}
          aria-label={`PIN-код, введено ${active.length} из ${MAX}`}
          value={active}
        />

        <div className="pin-dots" aria-hidden="true">
          {Array.from({ length: MAX }, (_, i) => (
            <span key={i} className={i < active.length ? 'on' : ''} />
          ))}
        </div>

        {error && <div className="access-error" role="alert">{error}</div>}

        <div className="pin-pad">
          {KEYS.map((key) => {
            if (key === 'gap') return <span key="gap" className="pin-gap" />;
            return (
              <button
                key={key}
                type="button"
                className={`pin-key ${key === 'del' ? 'pin-del' : ''}`}
                onClick={() => press(key)}
                aria-label={key === 'del' ? 'Удалить цифру' : key}
              >
                {key === 'del' ? <BackspaceIcon /> : key}
              </button>
            );
          })}
        </div>

        {setup && phase === 'repeat' && (
          <button className="access-submit ghost" type="button" onClick={() => { setPhase('enter'); setError(''); }}>Назад</button>
        )}
        <button className="access-submit" type="button" onClick={submit} disabled={!canSubmit}>
          {setup ? (phase === 'enter' ? 'Дальше' : 'Сохранить PIN') : 'Войти'}
        </button>
        <small className="access-hint">Журнал хранится только на этом устройстве.</small>
      </div>
    </main>
  );
}

function BackspaceIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5.5h10.5A1.5 1.5 0 0 1 21 7v10a1.5 1.5 0 0 1-1.5 1.5H9L3 12z" />
      <path d="M15.5 9.5 10.5 14M10.5 9.5l5 4.5" />
    </svg>
  );
}
