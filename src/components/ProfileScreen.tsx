import { useRef, useState } from 'react';
import { useWorkout } from '../domain/WorkoutContext';
import { useAccess } from '../domain/access';
import { cycleTotals, normalizeState } from '../domain/state';
import { formatKg } from '../utils/format';

interface ProfileScreenProps {
  visible: boolean;
  canInstall: boolean;
  onInstall: () => void;
  onToast: (message: string) => void;
}

export function ProfileScreen({ visible, canInstall, onInstall, onToast }: ProfileScreenProps) {
  const { state, setTheme, resetDays, replaceState } = useWorkout();
  const { lock } = useAccess();
  const fileInput = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const totals = cycleTotals(state);

  const exportJournal = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meso-journal-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onToast('Журнал экспортирован');
  };

  const importJournal = async (file: File) => {
    try {
      const imported = normalizeState(JSON.parse(await file.text()));
      replaceState(imported);
      onToast('Журнал импортирован');
    } catch {
      onToast('Не удалось прочитать файл журнала');
    }
  };

  return (
    <main id="scr-profile" className={`screen ${visible ? 'on' : ''}`}>
      <header className="profile-head wrap">
        <span className="label">настройки</span>
        <h1>Профиль</h1>
        <p>Приложение, журнал и персонализация</p>
      </header>

      <div className="profile-content wrap">
        <section className="profile-card profile-summary">
          <div className="profile-avatar">М</div>
          <div>
            <span className="label">Ваш журнал</span>
            <strong>{totals.days} из 12 тренировок</strong>
            <p>{formatKg(totals.tonn)} кг · {totals.sets} подходов</p>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-card-title">Внешний вид</div>
          <div className="theme-switch" role="group" aria-label="Выбор темы">
            <button className={state.theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}><i aria-hidden="true">🌙</i>Тёмная</button>
            <button className={state.theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}><i aria-hidden="true">☀️</i>Светлая</button>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-card-title">Безопасность</div>
          <button className="profile-row" onClick={lock}>
            <span><b>Заблокировать МЕЗО</b><small>Ввести PIN при следующем открытии</small></span><i className="emo" aria-hidden="true">🔒</i>
          </button>
        </section>

        <section className="profile-card">
          <div className="profile-card-title">Данные</div>
          <button className="profile-row" onClick={exportJournal}>
            <span><b>Экспортировать журнал</b><small>Сохранить данные в JSON-файл</small></span><i className="emo" aria-hidden="true">📤</i>
          </button>
          <button className="profile-row" onClick={() => fileInput.current?.click()}>
            <span><b>Импортировать журнал</b><small>Восстановить данные из файла</small></span><i className="emo" aria-hidden="true">📥</i>
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void importJournal(file); event.target.value = ''; }} />
        </section>

        {canInstall && (
          <section className="profile-card install-card">
            <div className="profile-card-title">Установка</div>
            <p>Добавьте МЕЗО на домашний экран OnePlus 15 для запуска без адресной строки.</p>
            <button className="btn-primary" onClick={onInstall}><i className="emo" aria-hidden="true">📲</i>Установить приложение</button>
          </section>
        )}

        <section className="profile-card danger-card">
          <div className="profile-card-title">Сброс</div>
          {!confirmReset ? (
            <button className="profile-row danger" onClick={() => setConfirmReset(true)}>
              <span><b>Сбросить журнал</b><small>Удалить все отметки и результаты</small></span><i className="emo" aria-hidden="true">🗑️</i>
            </button>
          ) : (
            <div className="confirm-row">
              <span>Удалить все данные?</span>
              <button className="txt-btn ok" onClick={() => { resetDays(); setConfirmReset(false); onToast('Журнал сброшен'); }}>Да, сбросить</button>
              <button className="txt-btn cancel" onClick={() => setConfirmReset(false)}>Отмена</button>
            </div>
          )}
        </section>

        <p className="profile-version">МЕЗО · v0.2.0</p>
      </div>
    </main>
  );
}
