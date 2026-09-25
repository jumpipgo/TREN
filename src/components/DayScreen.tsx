import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { DAYS, DOW, TAGS } from '../content/program';
import { useWorkout } from '../domain/WorkoutContext';
import {
  dayStats,
  getSet,
  lastPerf,
  restDurationForExercise,
  setKey,
} from '../domain/state';
import type { HelpKey } from '../domain/types';
import { formatWeight, vibrate } from '../utils/format';
import { inferMuscle } from '../utils/muscles';
import { PlayIcon, BackIcon } from './Icons';

interface DayScreenProps {
  visible: boolean;
  day: number;
  onBack: () => void;
  onDayChange: (day: number) => void;
  onOpenHelp: (key: HelpKey) => void;
  onOpenWeight: (exercise: number, set: number, weight: number | null) => void;
  onOpenVideo: (url: string) => void;
  onStartRest: (seconds: number) => void;
  onRequestWakeLock: () => void;
}

export function DayScreen({
  visible,
  day,
  onBack,
  onDayChange,
  onOpenHelp,
  onOpenWeight,
  onOpenVideo,
  onStartRest,
  onRequestWakeLock,
}: DayScreenProps) {
  const { state, setReps, setWeight, toggleSet } = useWorkout();
  const listRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [openCards, setOpenCards] = useState<Set<number>>(new Set());
  const program = DAYS[day - 1];
  const stats = dayStats(state, day);
  const finished = Boolean(state.days[String(day)]?.finished);

  useEffect(() => {
    setOpenCards(new Set());
    const chip = document.querySelector(`#dstrip .dch[data-n="${day}"]`);
    chip?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [day]);

  useEffect(() => {
    const onBeforePrint = () => {
      listRef.current?.querySelectorAll('.ex').forEach((card) => card.classList.add('open'));
    };
    const onAfterPrint = () => {
      listRef.current?.querySelectorAll('.ex').forEach((card, index) => {
        if (!openCards.has(index)) card.classList.remove('open');
      });
    };
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, [openCards]);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('input,button,a,summary,[contenteditable="true"]')) return;
      if (event.key === 'ArrowRight') onDayChange(day + 1);
      if (event.key === 'ArrowLeft') onDayChange(day - 1);
      if (event.key === ' ') {
        event.preventDefault();
        const row = listRef.current?.querySelector<HTMLElement>('.set-row:not(.done)');
        const card = row?.closest<HTMLElement>('.ex');
        if (row && card) handleToggle(Number(card.dataset.ex), Number(row.dataset.set));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!program) return null;

  const currentExercise = program.ex.findIndex((_, index) => {
    return Array.from({ length: program.ex[index].s }, (_, offset) => {
      const set = getSet(state, day, index, offset + 1);
      return !set?.done;
    }).some(Boolean);
  });

  function handleToggle(exercise: number, set: number) {
    if (finished) return;
    const record = getSet(state, day, exercise, set);
    const currentWeight = record?.w ?? null;
    const currentReps = record?.r ?? null;
    const nextDone = !record?.done;
    toggleSet(day, exercise, set, currentWeight, currentReps);
    if (nextDone) {
      vibrate(15);
      void onRequestWakeLock();
      onStartRest(restDurationForExercise(exercise, program.ex[exercise]));
      autoAdvance(exercise, set);
    } else {
      vibrate(10);
    }
  }

  function autoAdvance(exercise: number, set: number) {
    window.setTimeout(() => {
      const current = listRef.current?.querySelector<HTMLElement>(`[data-ex="${exercise}"][data-set="${set}"]`);
      const next = current?.closest<HTMLElement>('.ex')?.querySelector<HTMLElement>('.set-row:not(.done)');
      const nextExercise = current?.closest<HTMLElement>('.ex')?.parentElement?.querySelector<HTMLElement>('.ex:not(.done-card) .set-row:not(.done)');
      (next ?? nextExercise)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 160);
  }

  function stepWeight(exercise: number, set: number, delta: number) {
    const record = getSet(state, day, exercise, set);
    const previous = Number(record?.w ?? 0);
    const next = Math.max(0, Number((previous + delta).toFixed(2)));
    setWeight(day, exercise, set, next || null);
  }

  function updateReps(exercise: number, set: number, value: string) {
    const clean = value.trim();
    const reps = /^\d+$/.test(clean) ? Number.parseInt(clean, 10) : null;
    setReps(day, exercise, set, reps);
  }

  function toggleCard(index: number) {
    if (finished) return;
    setOpenCards((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <main
      id="scr-day"
      className={`screen ${visible ? 'on' : ''}`}
      onTouchStart={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest('input,button,a,.sheet,#dstrip')) {
          touchStart.current = null;
          return;
        }
        const point = event.touches[0];
        touchStart.current = { x: point.clientX, y: point.clientY };
      }}
      onTouchEnd={(event) => {
        if (!touchStart.current) return;
        const dx = touchStart.current.x - event.changedTouches[0].clientX;
        const dy = touchStart.current.y - event.changedTouches[0].clientY;
        touchStart.current = null;
        if (Math.abs(dx) > 60 && Math.abs(dy) < 50) onDayChange(day + (dx > 0 ? 1 : -1));
      }}
    >
      <header className="day-head">
        <div className="dh-in">
          <button className="icon-btn" onClick={onBack} aria-label="К экрану «Сегодня»"><BackIcon /></button>
          <div>
            <div className="dh-sub">неделя {Math.ceil(day / 3)} · {DOW[(day - 1) % 3]} · {TAGS[(day - 1) % 3]}</div>
            <h1>Тренировка #{day}</h1>
          </div>
          <button className="dh-prog" onClick={() => onOpenHelp('progress')} aria-label="Справка: прогресс тренировки">{finished ? '✓' : `${stats.done}/${stats.total}`}</button>
        </div>
        <div className="dh-bar"><i style={{ width: `${stats.total ? (stats.done / stats.total) * 100 : 0}%` }} /></div>
      </header>

      <div id="dstrip">
        {DAYS.map((_, index) => {
          const number = index + 1;
          const dayFinished = Boolean(state.days[String(number)]?.finished);
          const partial = !dayFinished && dayStats(state, number).done > 0;
          const className = dayFinished ? 'fin' : number === day ? 'cur' : partial ? 'part' : '';
          return <button key={number} className={`dch ${className}`} data-n={number} onClick={() => number !== day && onDayChange(number)} aria-label={`Тренировка ${number}`}>{number}</button>;
        })}
      </div>

      <section className="goal-line wrap"><span className="label">Цель</span><p dangerouslySetInnerHTML={{ __html: program.goal }} /></section>
      <details className="blk method" id="methodBlk">
        <summary>Методика <span className="chev">›</span></summary>
        <div className="blk-body" id="mBody">{program.notes.map((note) => <p key={note} dangerouslySetInnerHTML={{ __html: note }} />)}</div>
      </details>

      <div id="exList" ref={listRef}>
        {program.ex.map((exercise, exerciseIndex) => {
          const previous = lastPerf(state, exercise.name, day);
          const records = Array.from({ length: exercise.s }, (_, index) => getSet(state, day, exerciseIndex, index + 1));
          const doneCount = records.filter((record) => record?.done).length;
          const cardDone = doneCount === exercise.s;
          const cardOpen = cardDone && openCards.has(exerciseIndex);
          const active = currentExercise === exerciseIndex;
          const allMax = cardDone && records.every((record) => record?.done && record.r !== null && record.r >= exercise.max);
          const target = inferMuscle(exercise.name);
          const previousText = previous?.pairs.map((pair) => `${pair.w != null ? `${formatWeight(pair.w)} × ` : ''}${pair.r ?? '–'}`).join(', ');

          return (
            <article key={`${exercise.name}-${exerciseIndex}`} className={`ex ${cardDone ? 'done-card' : ''} ${active ? 'current' : ''} ${finished ? 'locked' : ''} ${cardOpen ? 'open' : ''}`} data-ex={exerciseIndex}>
              <div className="ex-head" onClick={() => cardDone && toggleCard(exerciseIndex)} role={cardDone ? 'button' : undefined} tabIndex={cardDone ? 0 : undefined}>
                <div className="ex-top">
                  <span className="ex-n">{exerciseIndex + 1}</span>
                  <button type="button" className="ex-name" data-youtube-url={exercise.url} onClick={(event) => { event.stopPropagation(); onOpenVideo(exercise.url); }}><span className="ex-label">{exercise.name}</span><span className="play"><PlayIcon /></span></button>
                </div>
                <div className="ex-meta">
                  <span className="ex-scheme">{exercise.s} × {exercise.min}–{exercise.max}</span>
                  <span className="ex-target" style={{ '--mc': target.color } as CSSProperties}><i />цель: {target.label}</span>
                  <button className="qi" onClick={(event) => { event.stopPropagation(); onOpenHelp('scheme'); }} aria-label="Справка: схема подходов">?</button>
                  {previous && <span className="ex-last" onClick={(event) => { event.stopPropagation(); onOpenHelp('last'); }}>прошлый раз: <b>{previousText}</b></span>}
                  <button className="pr" onClick={(event) => { event.stopPropagation(); onOpenHelp('pr'); }} aria-label="Справка: прогрессия веса" hidden={!allMax}><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 10V2M2.8 5.2L6 2l3.2 3.2" /></svg>все повторы на максимуме — +2,5 кг</button>
                </div>
                <div className="ex-sum">Итог: {records.filter((record) => record?.w != null && record.w > 0).map((record) => formatWeight(record?.w ?? null)).filter(Boolean)[0] ? `${formatWeight(records.find((record) => record?.w != null && record.w > 0)?.w ?? null)} кг · ` : ''}{records.map((record) => record?.r ?? '–').join(', ')}</div>
              </div>
              <div className="ex-body"><div className="ex-bin">
                <div className="fld-cap">
                  <button className="qi" onClick={() => onOpenHelp('check')} aria-label="Справка: отметка подхода">?</button>
                  <span className="fc-n">№</span><span />
                  <span className="fc-lb">вес<button className="qi" onClick={() => onOpenHelp('weight')} aria-label="Справка: вес подхода">?</button></span>
                  <span />
                  <span className="fc-lb">повт<button className="qi" onClick={() => onOpenHelp('reps')} aria-label="Справка: повторы">?</button></span>
                </div>
                <ol className="sets">
                  {Array.from({ length: exercise.s }, (_, index) => {
                    const set = index + 1;
                    const record = getSet(state, day, exerciseIndex, set);
                    const previousWeight = previous?.pairs[index]?.w ?? previous?.w ?? null;
                    const weight = record?.w ?? previousWeight;
                    const reps = record?.r;
                    const done = Boolean(record?.done);
                    const currentSet = !done && active && records.findIndex((item) => !item?.done) === index;
                    return (
                      <li key={setKey(exerciseIndex, set)} className={`set-row ${currentSet ? 'current' : ''} ${done ? 'done' : ''}`} data-ex={exerciseIndex} data-set={set}>
                        <button className="check" onClick={() => handleToggle(exerciseIndex, set)} disabled={finished} role="checkbox" aria-checked={done} aria-label={`Подход ${set}`} />
                        <span className="set-n">{set}</span>
                        <button className="st" onClick={() => stepWeight(exerciseIndex, set, -2.5)} disabled={finished} aria-label="Минус 2,5 кг">−</button>
                        <button className={`wbtn ${weight ? '' : 'empty'}`} data-w={weight ?? ''} onClick={() => onOpenWeight(exerciseIndex, set, weight)} disabled={finished} aria-label={`Вес подхода ${set}`}>{weight ? formatWeight(weight) : '—'}{weight ? <small>кг</small> : null}</button>
                        <button className="st" onClick={() => stepWeight(exerciseIndex, set, 2.5)} disabled={finished} aria-label="Плюс 2,5 кг">+</button>
                        <input className={`reps ${reps !== null && reps !== undefined && reps >= exercise.max ? 'hi' : reps !== null && reps !== undefined && reps > 0 && reps < exercise.min ? 'lo' : ''}`} inputMode="numeric" autoComplete="off" placeholder={`${exercise.min}–${exercise.max}`} value={reps ?? ''} onChange={(event) => updateReps(exerciseIndex, set, event.target.value)} disabled={finished} aria-label={`Повторения подхода ${set}`} />
                      </li>
                    );
                  })}
                </ol>
              </div></div>
            </article>
          );
        })}
      </div>
      <p className="day-foot">«?» у любого поля — справка с примером · свайп ←/→ — соседняя тренировка · <span className="mono">пробел</span> — отметить подход · ссылки на технику открываются с нужной секунды</p>
    </main>
  );
}
