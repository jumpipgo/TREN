import { useEffect, useRef, useState } from 'react';
import { HELP } from '../content/help';
import { DAYS, OUTRO } from '../content/program';
import type { HelpKey, SummaryData } from '../domain/types';
import { formatKg, vibrate } from '../utils/format';
import type { YouTubeVideo } from '../utils/youtube';
import { Sheet } from './Sheet';
import { HomeIcon, PrintIcon } from './Icons';
import { useWheelNumber } from './NumberWheel';

export interface WeightContext {
  day: number;
  exercise: number;
  set: number;
  weight: number | null;
}

interface OverlaysProps {
  scrimOpen: boolean;
  onClose: () => void;
  weightContext: WeightContext | null;
  onSaveWeight: (value: number | null) => void;
  onApplyAllWeight: (value: number) => void;
  helpKey: HelpKey | null;
  summary: SummaryData | null;
  video: YouTubeVideo | null;
  onCloseVideo: () => void;
  milestoneOpen: boolean;
  onCloseMilestone: () => void;
  onHomeFromSummary: () => void;
  onToast: (message: string) => void;
}

export function WeightSheet({ context, onClose, onSave, onApplyAll }: { context: WeightContext | null; onClose: () => void; onSave: (value: number | null) => void; onApplyAll: (value: number) => void }) {
  const [value, setValue] = useState<number | null>(null);
  useEffect(() => {
    if (context) setValue(context.weight);
  }, [context]);
  const exercise = context ? DAYS[context.day - 1].ex[context.exercise] : null;

  const wheel = useWheelNumber({ value, onChange: setValue, min: 0, max: 400, step: 0.5, pixelsPerStep: 10 });

  const change = (delta: number) => {
    vibrate(8);
    setValue((current) => {
      const next = Math.max(0, Number(((current ?? 0) + delta).toFixed(2)));
      return next || null;
    });
  };

  const parsed = value ?? 0;
  const valid = parsed > 0;
  const canApplyAll = Boolean(context && valid && (context.set ?? 0) > 1);
  const shown = value != null ? formatKg(value).replace(' кг', '') : '—';

  return (
    <Sheet open={Boolean(context)} onClose={onClose} id="shW" label="Вес подхода">
      <div className="sh-title">Вес, кг</div>
      <div className="sh-sub">{exercise?.name ?? ''} · подход {context?.set ?? ''}</div>
      <div className="ws-lbl">колесо или шаги</div>
      <div
        className={`ws-dial ${value != null ? 'wheel-own' : ''}`}
        id="wsIn"
        role="spinbutton"
        tabIndex={0}
        aria-label="Вес подхода в килограммах"
        aria-valuenow={value ?? undefined}
        aria-valuemin={0}
        aria-valuemax={400}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp') { event.preventDefault(); change(0.5); }
          if (event.key === 'ArrowDown') { event.preventDefault(); change(-0.5); }
        }}
        {...wheel.handlers}
      >
        <b>{value != null ? shown : 'крутите'}</b>
        {value != null && <small>кг</small>}
      </div>
      <div className="ws-grid">
        {[-5, -2.5, -1.25, 1.25, 2.5, 5].map((delta) => <button key={delta} className="ws-btn" onClick={() => change(delta)}>{delta > 0 ? '+' : ''}{String(delta).replace('.', ',')}</button>)}
      </div>
      {canApplyAll && (
        <button
          className="ws-all"
          onClick={() => { onApplyAll(parsed); onClose(); }}
        >
          Применить {shown} кг к подходам 1–{(context?.set ?? 0) - 1}
        </button>
      )}
      <button className="btn-primary" id="wsOk" onClick={() => { onSave(valid ? parsed : 0); }} disabled={!valid}>Готово</button>
    </Sheet>
  );
}

export function HelpSheet({ helpKey, onClose }: { helpKey: HelpKey | null; onClose: () => void }) {
  const help = helpKey ? HELP[helpKey] : null;
  return (
    <Sheet open={Boolean(help)} onClose={onClose} id="shH" label="Справка по полю">
      <div className="sh-title" id="hhTitle">{help?.title}</div>
      <p className="hh-body" id="hhBody" dangerouslySetInnerHTML={{ __html: help?.body ?? '' }} />
      <div className="hh-ex"><span className="label">пример</span><div className="hhx" id="hhEx" dangerouslySetInnerHTML={{ __html: help?.example ?? '' }} /></div>
      <button className="btn-primary" id="hhOk" onClick={onClose}>Понятно</button>
    </Sheet>
  );
}

export function SummarySheet({ summary, onClose, onHome }: { summary: SummaryData | null; onClose: () => void; onHome: () => void }) {
  return (
    <Sheet open={Boolean(summary)} onClose={onClose} id="shF" label="Итоги тренировки">
      <div className="sh-title" id="finTitle">{summary ? `Тренировка #${summary.day} завершена` : 'Тренировка завершена'}</div>
      <div className="sh-sub">подходы зафиксированы в журнале</div>
      <div className="fin-nums"><b id="finTonn">{summary ? formatKg(summary.tonnage) : '0'}</b><span>кг · тоннаж</span><button className="qm" aria-label="Справка: тоннаж">?</button></div>
      {summary?.incompleteSets ? <div className="fin-warning">Без веса или повторов: {summary.incompleteSets} подходов — они не добавлены в тоннаж.</div> : null}
      <div className="fin-rows">
        <div className="fin-row"><span>Подходы</span><b>{summary ? `${summary.done}/${summary.total}` : '0/0'}</b></div>
        <div className="fin-row"><span>Повторения</span><b>{summary?.reps ?? 0}</b></div>
        <div className="fin-row"><span>Время сессии</span><b>{summary?.time ?? '—'}</b></div>
      </div>
      {summary?.progression.length ? <div className="fin-pr" id="finPr"><span className="label">прогрессия к следующему разу</span>{summary.progression.slice(0, 4).map((name) => <span className="pr" key={name}><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 10V2M2.8 5.2L6 2l3.2 3.2" /></svg>{name} · +2,5 кг</span>)}</div> : null}
      <div className="sh-actions"><button className="btn-ghost" id="btnPrint" onClick={() => window.print()}><PrintIcon />Печать / PDF</button><button className="btn-primary" id="finHome" onClick={onHome}><HomeIcon size={16} />На главную</button></div>
    </Sheet>
  );
}

export function MilestoneSheet({ open, onClose, onToast }: { open: boolean; onClose: () => void; onToast: (message: string) => void }) {
  return (
    <Sheet open={open} onClose={onClose} id="shMs" label="Программа завершена">
      <div id="msBody">
        <h2>{OUTRO.title}</h2><p dangerouslySetInnerHTML={{ __html: OUTRO.p1 }} /><p dangerouslySetInnerHTML={{ __html: OUTRO.p2 }} />
        <button className="btn-primary" onClick={() => { onClose(); onToast('Заглушка прототипа: следующая программа подключается на уровне контента'); }}>{OUTRO.cta}</button>
        <p className="after">{OUTRO.p3}</p><blockquote>{OUTRO.quote}</blockquote>
      </div>
    </Sheet>
  );
}

function VideoModal({ video, onClose }: { video: YouTubeVideo | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!video) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [video, onClose]);

  return (
    <div
      className={`yt-modal ${video ? 'on' : ''}`}
      aria-hidden={!video}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="yt-dialog" role="dialog" aria-modal="true" aria-label="Видео упражнения">
        <button ref={closeRef} type="button" className="yt-close" onClick={onClose} tabIndex={video ? 0 : -1} aria-label="Закрыть видео">×</button>
        <div className="yt-frame">
          {video ? (
            <iframe
              key={video.embedUrl}
              src={video.embedUrl}
              title="Видео упражнения"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function Overlays({ scrimOpen, onClose, weightContext, onSaveWeight, onApplyAllWeight, helpKey, summary, video, onCloseVideo, milestoneOpen, onCloseMilestone, onHomeFromSummary, onToast }: OverlaysProps) {
  return (
    <>
      <div id="scrim" className={scrimOpen ? 'on' : ''} onClick={onClose} />
      <WeightSheet context={weightContext} onClose={onClose} onSave={onSaveWeight} onApplyAll={onApplyAllWeight} />
      <HelpSheet helpKey={helpKey} onClose={onClose} />
      <SummarySheet summary={summary} onClose={onClose} onHome={onHomeFromSummary} />
      <VideoModal video={video} onClose={onCloseVideo} />
      <MilestoneSheet open={milestoneOpen} onClose={onCloseMilestone} onToast={onToast} />
    </>
  );
}
