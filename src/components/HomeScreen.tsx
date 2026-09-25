import { useEffect } from 'react';
import { DAYS, DOW, OUTRO, TAGS } from '../content/program';
import { useWorkout } from '../domain/WorkoutContext';
import { allDone, cycleTotals, dayStats, nextDay } from '../domain/state';
import { formatKg } from '../utils/format';
import { ThemeIcon } from './Icons';

interface HomeScreenProps {
  visible: boolean;
  onOpenDay: (day: number) => void;
  onOpenCycle: () => void;
  onToast: (message: string) => void;
  onCelebrate: () => void;
}

function ringPath(start: number, end: number): string {
  const radius = 82;
  const center = 90;
  const angle = (degrees: number) => (degrees * Math.PI) / 180 - Math.PI / 2;
  const a0 = angle(start);
  const a1 = angle(end);
  const x0 = center + radius * Math.cos(a0);
  const y0 = center + radius * Math.sin(a0);
  const x1 = center + radius * Math.cos(a1);
  const y1 = center + radius * Math.sin(a1);
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${radius} ${radius} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

function ProgressRing({ state, currentDay }: { state: ReturnType<typeof useWorkout>['state']; currentDay: number | null }) {
  const currentWeek = currentDay ? Math.ceil(currentDay / 3) : 4;
  const paths = Array.from({ length: 4 }, (_, index) => {
    const week = index + 1;
    const days = [(week - 1) * 3 + 1, (week - 1) * 3 + 2, (week - 1) * 3 + 3];
    const finished = days.every((day) => state.days[String(day)]?.finished);
    const partial = !finished && days.some((day) => dayStats(state, day).done > 0);
    const className = finished ? 'done' : week === currentWeek ? 'cur' : partial ? 'part' : '';
    return <path key={week} className={`seg ${className}`} d={ringPath((week - 1) * 90 + 7, week * 90 - 7)} />;
  });
  return <svg viewBox="0 0 180 180">{paths}</svg>;
}

export function HomeScreen({ visible, onOpenDay, onOpenCycle, onToast, onCelebrate }: HomeScreenProps) {
  const { state, setTheme } = useWorkout();
  const currentDay = nextDay(state);
  const activeDay = currentDay ?? 1;
  const totals = cycleTotals(state);
  const completed = allDone(state);
  const week = currentDay ? Math.ceil(currentDay / 3) : 4;

  useEffect(() => {
    if (visible && completed) onCelebrate();
  }, [completed, onCelebrate, visible]);

  const ringDots = [1, 2, 3].map((index) => {
    const day = (week - 1) * 3 + index;
    const finished = Boolean(state.days[String(day)]?.finished);
    const partial = !finished && day !== currentDay && dayStats(state, day).done > 0;
    const current = !finished && day === currentDay;
    const className = finished ? 'fin' : partial ? 'part' : current ? 'now' : '';
    const label = finished ? 'выполнена' : current ? 'следующая' : 'предстоит';
    return <i key={day} className={`ring-dot ${className}`} aria-label={`Тренировка ${day}: ${label}`} />;
  });

  const center = completed ? (
    <>
      <span className="rl">цикл завершён</span>
      <span className="rv">12<span className="ring-den">/12</span></span>
      <span className="rs">неделя 4 из 4</span>
      <span className="ring-mini">{ringDots}</span>
    </>
  ) : (
    <>
      <span className="rl">неделя {week} из 4</span>
      <span className="rv">{totals.days}<span className="ring-den">/12</span></span>
      <span className="rs">тренировок завершено</span>
      <span className="ring-mini">{ringDots}</span>
    </>
  );

  const currentTraining = currentDay ? DAYS[currentDay - 1] : null;
  const currentStats = currentDay ? dayStats(state, currentDay) : { done: 0, total: 0 };
  const started = currentStats.done > 0;

  return (
    <main id="scr-home" className={`screen ${visible ? 'on' : ''}`}>
      <header className="top">
        <button className="brand brand-button" onClick={onOpenCycle} aria-label="Открыть карту цикла">
          <b>МЕЗО<i>.</i></b><span>тренировки · offline</span>
        </button>
        <button
          className="icon-btn"
          onClick={() => {
            const theme = state.theme === 'dark' ? 'light' : 'dark';
            setTheme(theme);
            onToast(theme === 'dark' ? 'Тёмная тема — для зала' : 'Светлая тема — для дома');
          }}
          aria-label="Переключить тему"
        >
          <ThemeIcon />
        </button>
      </header>
      <div id="homeBody">
        <section className="hero home-overview">
          <div className="overview-top"><span className="label">прогресс макроцикла</span><span className="overview-week">{completed ? 'завершено' : `неделя ${week} / 4`}</span></div>
          <div className="ring"><ProgressRing state={state} currentDay={currentDay} /> <div className="ring-c">{center}</div></div>
        </section>

        {completed ? (
          <section className="done-hero">
            <span className="label">цикл завершён</span>
            <h2>{OUTRO.title}</h2>
            <p dangerouslySetInnerHTML={{ __html: OUTRO.p1 }} />
            <p dangerouslySetInnerHTML={{ __html: OUTRO.p2 }} />
            <button className="btn-primary" onClick={() => {
              onToast('Заглушка прототипа: следующая программа подключается на уровне контента');
              onCelebrate();
            }}>{OUTRO.cta}</button>
            <p className="after">{OUTRO.p3}</p>
            <blockquote className="q">{OUTRO.quote}</blockquote>
          </section>
        ) : currentTraining ? (
          <section className="today">
            <span className="label">{started ? 'тренировка в процессе' : 'следующая тренировка'}</span>
            <h1 className="t-title">Тренировка #{activeDay}</h1>
            <div className="t-tag">{DOW[(activeDay - 1) % 3]} · {TAGS[(activeDay - 1) % 3]}</div>
            <p className="t-goal" dangerouslySetInnerHTML={{ __html: currentTraining.goal }} />
            <div className="t-meta">
              {currentTraining.ex.length} упражнений · {currentStats.total} подходов
              {started ? ` · выполнено ${currentStats.done}` : ''}
            </div>
            <button className="btn-primary" onClick={() => onOpenDay(activeDay)}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z" /></svg>
              {started ? 'Продолжить' : 'Начать тренировку'}{started ? <small>{currentStats.done}/{currentStats.total}</small> : null}
            </button>
          </section>
        ) : null}

        {(totals.tonn > 0 || totals.sets > 0) && (
          <section className="stats">
            <div className="st3"><b>{formatKg(totals.tonn)}</b><span>кг · тоннаж</span></div>
            <div className="st3"><b>{totals.sets}</b><span>подходов</span></div>
            <div className="st3"><b>{totals.days}/12</b><span>тренировок</span></div>
          </section>
        )}

        {!completed && (
          <section className="week">
            <span className="label">неделя {week} из 4</span>
            <div className="wk-chips">
              {Array.from({ length: 7 }, (_, index) => {
                const names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
                const isTraining = index % 2 === 0 && index < 6;
                const dayNumber = (week - 1) * 3 + Math.floor(index / 2) + 1;
                const finished = isTraining && Boolean(state.days[String(dayNumber)]?.finished);
                const partial = isTraining && !finished && dayStats(state, dayNumber).done > 0;
                const current = isTraining && dayNumber === currentDay;
                const className = isTraining ? (finished ? 'done' : current ? 'now' : '') : 'rest';
                const sub = finished ? '✓' : partial ? '…' : isTraining ? ['грудь', 'спина', 'ноги'][Math.floor(index / 2)] : 'отдых';
                return <div key={names[index]} className={`wd ${className}`}><b>{names[index]}</b><span>{sub}</span></div>;
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
