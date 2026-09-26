import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { DAYS, DOW, TAGS } from '../content/program';
import { useWorkout } from '../domain/WorkoutContext';
import {
  carryWeight,
  dayStats,
  getSet,
  lastPerf,
  restDurationForExercise,
  setKey,
} from '../domain/state';
import type { HelpKey } from '../domain/types';
import { formatWeight, vibrate } from '../utils/format';
import { inferMuscle } from '../utils/muscles';

/** Сколько чисел в ряд: чтобы окно выбора не выглядело «хвостом» из одного числа. */
function repsColumns(count: number): number {
  if (count <= 4) return count;
  if (count <= 8) return 4;
  if (count <= 15) return 5;
  return 6;
}
import { PlayIcon, BackIcon, PickIcon } from './Icons';

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
  const { state, setReps, toggleSet } = useWorkout();
  const listRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [openCards, setOpenCards] = useState<Set<number>>(new Set());
  // Быстрый выбор повторов: диапазон конкретного упражнения, а не все цифры
  const [repsChoice, setRepsChoice] = useState<{ exercise: number; set: number; min: number; max: number } | null>(null);
  const program = DAYS[day - 1];
  const stats = dayStats(state, day);
  const finished = Boolean(state.days[String(day)]?.finished);

  useEffect(() => { setRepsChoice(null); }, [day]);

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
    const previous = lastPerf(state, program.ex[exercise].name, day);
    const previousWeight = previous?.pairs[set - 1]?.w ?? previous?.w ?? null;
    // The weight button displays a fallback (carry-over or previous performance); persist it on completion too.
    const currentWeight = record?.w ?? carryWeight(state, day, exercise, set) ?? previousWeight;
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
          <button className="dh-prog" onClick={() => onOpenHelp('progress')} aria-label="Справка: прогресс тренировки">{finished ? '✊' : `${stats.done}/${stats.total}`}</button>
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
                  <span className="fc-n">№</span>
                  <span className="fc-lb">вес<button className="qi" onClick={() => onOpenHelp('weight')} aria-label="Справка: вес подхода">?</button></span>
                  <span className="fc-lb">повт<button className="qi" onClick={() => onOpenHelp('reps')} aria-label="Справка: повторы">?</button></span>
                </div>
                <ol className="sets">
                  {Array.from({ length: exercise.s }, (_, index) => {
                    const set = index + 1;
                    const record = getSet(state, day, exerciseIndex, set);
                    const previousWeight = previous?.pairs[index]?.w ?? previous?.w ?? null;
                    const carried = carryWeight(state, day, exerciseIndex, set);
                    const weight = record?.w ?? carried ?? previousWeight;
                    // Откуда взята цифра: своя — нормальный цвет, перенос/прошлый раз — приглушённый.
                    const source = record?.w != null ? 'own' : carried != null ? 'carried' : previousWeight != null ? 'prev' : 'none';
                    const reps = record?.r;
                    const done = Boolean(record?.done);
                    const currentSet = !done && active && records.findIndex((item) => !item?.done) === index;
                    return (
                      <li key={setKey(exerciseIndex, set)} className={`set-row ${currentSet ? 'current' : ''} ${done ? 'done' : ''}`} data-ex={exerciseIndex} data-set={set}>
                        <button className="check" onClick={() => handleToggle(exerciseIndex, set)} disabled={finished} role="checkbox" aria-checked={done} aria-label={`Подход ${set}`} />
                        <span className="set-n">{set}</span>
                        <button className={`wbtn src-${source} ${weight ? '' : 'empty'}`} data-w={weight ?? ''} onClick={() => onOpenWeight(exerciseIndex, set, weight)} disabled={finished} aria-label={`Вес подхода ${set}`}>{weight ? formatWeight(weight) : '—'}{weight ? <small>кг</small> : null}</button>
                        <button
                          className={`wbtn reps ${reps == null ? 'empty' : reps >= exercise.max ? 'hi' : reps < exercise.min ? 'lo' : ''}`}
                          onClick={() => setRepsChoice({ exercise: exerciseIndex, set, min: exercise.min, max: exercise.max })}
                          disabled={finished}
                          aria-haspopup="dialog"
                          aria-label={`Повторения подхода ${set}`}
                        >
                          {reps == null ? <span className="reps-hint">{exercise.min}–{exercise.max}</span> : <span className="reps-n">{reps}</span>}
                          <PickIcon />
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div></div>
            </article>
          );
        })}
      </div>
      <p className="day-foot">«?» у любого поля — справка с примером · повторы — тап по полю, откроется окно выбора · вес — тап по полю, крутится пальцем · свайп ←/→ — соседняя тренировка · <span className="mono">пробел</span> — отметить подход · ссылки на технику открываются с нужной секунды</p>

      {repsChoice && (
        <div className="choice" role="dialog" aria-label="Выбор повторов" onClick={(event) => { if (event.target === event.currentTarget) setRepsChoice(null); }}>
          <div className="choice-panel">
            <div className="choice-head">
              <b>Повторы</b>
              <small>подход {repsChoice.set} · {program.ex[repsChoice.exercise].name}</small>
            </div>
            <div className="choice-grid" style={{ '--cols': repsColumns(repsChoice.max - repsChoice.min + 1) } as CSSProperties}>
              {Array.from({ length: repsChoice.max - repsChoice.min + 1 }, (_, i) => repsChoice.min + i).map((value) => {
                const current = getSet(state, day, repsChoice.exercise, repsChoice.set)?.r === value;
                return (
                  <button
                    key={value}
                    className={`choice-btn ${current ? 'active' : ''} ${value >= repsChoice.max ? 'top' : ''}`}
                    onClick={() => { updateReps(repsChoice.exercise, repsChoice.set, String(value)); setRepsChoice(null); }}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
            <div className="choice-foot">
              <button
                className="choice-reset"
                onClick={() => { updateReps(repsChoice.exercise, repsChoice.set, ''); setRepsChoice(null); }}
                disabled={getSet(state, day, repsChoice.exercise, repsChoice.set)?.r == null}
              >
                Сбросить
              </button>
              <button className="choice-cancel" onClick={() => setRepsChoice(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
