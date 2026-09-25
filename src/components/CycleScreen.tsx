import { useState } from 'react';
import { DAYS, DOW, INTRO, LEGEND, TAGS } from '../content/program';
import { useWorkout } from '../domain/WorkoutContext';
import { dayStats, nextDay } from '../domain/state';
import { CheckIcon } from './Icons';

interface CycleScreenProps {
  visible: boolean;
  onOpenDay: (day: number) => void;
  onToast: (message: string) => void;
}

export function CycleScreen({ visible, onOpenDay, onToast }: CycleScreenProps) {
  const { state, resetDays } = useWorkout();
  const [confirmReset, setConfirmReset] = useState(false);
  const currentDay = nextDay(state);

  return (
    <main id="scr-cycle" className={`screen ${visible ? 'on' : ''}`}>
      <header className="c-head wrap">
        <span className="label">карта цикла</span>
        <h1>4 недели · 12 тренировок</h1>
        <p>Классический сплит · программа 1 из 3 макроцикла</p>
      </header>
      <details className="blk" id="introBlk">
        <summary>О программе <span className="chev">›</span></summary>
        <div className="blk-body">
          <p>{INTRO.lead}</p>
          {INTRO.ps.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <p><strong>{INTRO.motto}</strong></p>
          <blockquote className="q">{INTRO.quote}</blockquote>
        </div>
      </details>
      <div id="cycleBody">
        {Array.from({ length: 4 }, (_, weekIndex) => {
          const week = weekIndex + 1;
          return (
            <div key={week}>
              <div className="wk-label"><b>Неделя {week}</b><i /></div>
              {Array.from({ length: 3 }, (_, dayIndex) => {
                const dayNumber = (week - 1) * 3 + dayIndex + 1;
                const day = DAYS[dayNumber - 1];
                const stats = dayStats(state, dayNumber);
                const finished = Boolean(state.days[String(dayNumber)]?.finished);
                const className = finished ? 'fin' : dayNumber === currentDay ? 'now' : '';
                return (
                  <div key={dayNumber} className={`crow ${className}`} onClick={() => onOpenDay(dayNumber)} role="button" tabIndex={0} onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') onOpenDay(dayNumber);
                  }}>
                    <span className="cn">{dayNumber}</span>
                    <div className="ci">
                      <b>{DOW[(dayNumber - 1) % 3]} · {TAGS[(dayNumber - 1) % 3]}</b>
                      <span dangerouslySetInnerHTML={{ __html: day.goal }} />
                    </div>
                    <div className="cs">
                      {finished ? <span className="ck"><CheckIcon /></span> : stats.done > 0 ? <><span className="mini-bar"><i style={{ width: `${Math.round((stats.done / stats.total) * 100)}%` }} /></span><span className="mono">{stats.done}/{stats.total}</span></> : <span className="go">›</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <footer className="foot-note wrap">
        <em dangerouslySetInnerHTML={{ __html: LEGEND }} />
        <div className="reset-line">
          {!confirmReset ? (
            <button className="txt-btn" onClick={() => setConfirmReset(true)}>Сбросить прогресс</button>
          ) : (
            <>сбросить весь журнал? <button className="txt-btn ok" onClick={() => { resetDays(); setConfirmReset(false); onToast('Журнал сброшен'); }}>Да, сбросить</button><button className="txt-btn cancel" onClick={() => setConfirmReset(false)}>Отмена</button></>
          )}
        </div>
      </footer>
    </main>
  );
}
