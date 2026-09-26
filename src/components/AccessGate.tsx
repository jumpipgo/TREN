import { useState, type FormEvent, type ReactNode } from 'react';
import { isValidPin, useAccess } from '../domain/access';

export function AccessGate({ children }: { children: ReactNode }) {
  const { status, setPin, unlock } = useAccess();
  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  if (status === 'loading') {
    return <main className="access-screen"><div className="access-card"><b>МЕЗО</b><span>Проверка доступа…</span></div></main>;
  }

  if (status === 'unlocked') return <>{children}</>;

  const setup = status === 'setup';

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (setup) {
      if (!isValidPin(pin)) {
        setError('Введи от 4 до 6 цифр');
        return;
      }
      if (pin !== confirmPin) {
        setError('PIN-коды не совпадают');
        return;
      }
      try {
        await setPin(pin);
        setPinValue('');
        setConfirmPin('');
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Не удалось создать PIN');
      }
      return;
    }

    try {
      await unlock(pin);
      setPinValue('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Неверный PIN');
    }
  }

  return (
    <main className="access-screen">
      <form className="access-card" onSubmit={submit}>
        <b>МЕЗО</b>
        <h1>{setup ? 'Создай PIN-код' : 'Введи PIN-код'}</h1>
        <p>{setup ? 'Защити журнал локальным кодом доступа.' : 'Для продолжения нужен ваш PIN-код.'}</p>
        <label className="access-label" htmlFor="meso-pin">PIN-код</label>
        <input
          id="meso-pin"
          className="access-input"
          type="password"
          inputMode="numeric"
          autoComplete={setup ? 'new-password' : 'current-password'}
          pattern="[0-9]*"
          minLength={4}
          maxLength={6}
          value={pin}
          onChange={(event) => setPinValue(event.target.value.replace(/\D/g, '').slice(0, 6))}
          autoFocus
        />
        {setup && (
          <>
            <label className="access-label" htmlFor="meso-pin-confirm">Повтори PIN-код</label>
            <input
              id="meso-pin-confirm"
              className="access-input"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              pattern="[0-9]*"
              minLength={4}
              maxLength={6}
              value={confirmPin}
              onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </>
        )}
        {error && <div className="access-error" role="alert">{error}</div>}
        <button className="access-submit" type="submit">{setup ? 'Сохранить PIN' : 'Войти'}</button>
        <small className="access-hint">Журнал хранится только на этом устройстве.</small>
      </form>
    </main>
  );
}
