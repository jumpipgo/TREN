import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { HELP } from '../content/help';
import { DAYS, OUTRO } from '../content/program';
import type { HelpKey, SummaryData } from '../domain/types';
import { formatKg } from '../utils/format';
import type { YouTubeVideo } from '../utils/youtube';
import { Sheet } from './Sheet';
import { PrintIcon } from './Icons';

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
  const [value, setValue] = useState('');
  useEffect(() => {
    if (context) setValue(context.weight ? String(context.weight).replace('.', ',') : '');
  }, [context]);
  const exercise = context ? DAYS[context.day - 1].ex[context.exercise] : null;
  const change = (delta: number) => {
    const current = Number.parseFloat(value.replace(',', '.')) || 0;
    const next = Math.max(0, Number((current + delta).toFixed(2)));
    setValue(next ? String(next).replace('.', ',') : '');
  };
  const parsed = Number.parseFloat(value.replace(',', '.'));
  const valid = Number.isFinite(parsed) && parsed > 0;
  const canApplyAll = Boolean(context && valid && (context.set ?? 0) > 1);
  return (
    <Sheet open={Boolean(context)} onClose={onClose} id="shW" label="Вес подхода">
      <div className="sh-title">Вес, кг</div>
      <div className="sh-sub">{exercise?.name ?? ''} · подход {context?.set ?? ''}</div>
      <div className="ws-lbl">быстрый ввод</div>
      <input id="wsIn" inputMode="decimal" autoComplete="off" value={value} onChange={(event) => setValue(event.target.value)} />
      <div className="ws-grid">
        {[-5, -2.5, -1.25, 1.25, 2.5, 5].map((delta) => <button key={delta} className="ws-btn" onClick={() => change(delta)}>{delta > 0 ? '+' : ''}{String(delta).replace('.', ',')}</button>)}
      </div>
      {canApplyAll && (
        <button
          className="ws-all"
          onClick={() => { onApplyAll(parsed); onClose(); }}
        >
          Применить {String(parsed).replace('.', ',')} кг к подходам 1–{(context?.set ?? 0) - 1}
        </button>
      )}
      <button className="btn-primary" id="wsOk" onClick={() => { onSave(valid ? parsed : 0); }}>Готово</button>
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
      <div className="sh-actions"><button className="btn-ghost" id="btnPrint" onClick={() => window.print()}><PrintIcon />Печать / PDF</button><button className="btn-primary" id="finHome" onClick={onHome}>На главную</button></div>
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

type FloatSize = 'small' | 'wide';

const EDGE = 8;
/** Радиус, в котором окно примагничивается к краю экрана. */
const SNAP = 32;

function bounds(node: HTMLElement | null) {
  const rect = node?.getBoundingClientRect();
  const width = rect?.width ?? 240;
  const height = rect?.height ?? 140;
  return {
    minX: EDGE,
    maxX: Math.max(EDGE, window.innerWidth - width - EDGE),
    minY: EDGE,
    maxY: Math.max(EDGE, window.innerHeight - height - EDGE),
  };
}

/** Окно всегда остаётся целиком на экране — зажать его пальцем невозможно. */
function clampOffset(next: { x: number; y: number }, node: HTMLElement | null) {
  const { minX, maxX, minY, maxY } = bounds(node);
  return {
    x: Math.min(Math.max(next.x, minX), maxX),
    y: Math.min(Math.max(next.y, minY), maxY),
  };
}

/** После отпускания окно притягивается к ближайшему краю. */
function snapOffset(next: { x: number; y: number }, node: HTMLElement | null) {
  const { minX, maxX, minY, maxY } = bounds(node);
  const x = next.x <= minX + SNAP ? minX : next.x >= maxX - SNAP ? maxX : next.x;
  const y = next.y <= minY + SNAP ? minY : next.y >= maxY - SNAP ? maxY : next.y;
  return { x, y };
}

function VideoModal({ video, onClose }: { video: YouTubeVideo | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState<FloatSize>('small');

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

  // Каждое новое видео открывается в центре.
  useEffect(() => {
    if (!video) return;
    setOffset(null);
    setSize('small');
  }, [video]);

  // Границы: окно не уходит за экран, но хотя бы GRAB_VISIBLE px с заголовка остаются видимыми.
  useEffect(() => {
    if (!video || !offset) return;
    const clamp = () => setOffset((current) => (current ? clampOffset(current, dialogRef.current) : current));
    clamp();
    window.addEventListener('resize', clamp);
    window.addEventListener('orientationchange', clamp);
    return () => {
      window.removeEventListener('resize', clamp);
      window.removeEventListener('orientationchange', clamp);
    };
  }, [video, offset, size]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    const node = dialogRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    drag.current = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const next = clampOffset({ x: event.clientX - state.offsetX, y: event.clientY - state.offsetY }, dialogRef.current);
    setOffset((current) => (current && current.x === next.x && current.y === next.y ? current : next));
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    // «Магнит»: если окно ушло к самому краю, примагничиваем к нему, чтобы заголовок остался в руках.
    setOffset((current) => (current ? snapOffset(current, dialogRef.current) : current));
  };

  const resetPosition = () => setOffset(null);

  const style: CSSProperties | undefined = offset
    ? { position: 'absolute', left: offset.x, top: offset.y, right: 'auto', bottom: 'auto', transform: 'none', margin: 0 }
    : undefined;

  return (
    <div
      className={`yt-modal ${video ? 'on' : ''} ${offset ? 'floating' : ''}`}
      aria-hidden={!video}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        className={`yt-dialog ${size}`}
        style={style}
        role="dialog"
        aria-modal="true"
        aria-label="Видео упражнения"
      >
        <div
          className="yt-drag"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDoubleClick={resetPosition}
        >
          <span className="yt-grip" aria-hidden="true" />
          <span className="yt-hint"><i>тянуть</i><b>перетащи · двойной тап — в центр</b></span>
        </div>
        <div className="yt-actions">
          <button
            type="button"
            className="yt-size"
            onClick={() => setSize((current) => (current === 'small' ? 'wide' : 'small'))}
            tabIndex={video ? 0 : -1}
            aria-label={size === 'small' ? 'Увеличить окно видео' : 'Уменьшить окно видео'}
          >
            {size === 'small' ? '⤢' : '⤡'}
          </button>
          <button
            type="button"
            className="yt-size"
            onClick={resetPosition}
            tabIndex={video ? 0 : -1}
            aria-label="Вернуть окно в центр"
          >
            ⌖
          </button>
          <button
            ref={closeRef}
            type="button"
            className="yt-close"
            onClick={onClose}
            tabIndex={video ? 0 : -1}
            aria-label="Закрыть видео"
          >
            ×
          </button>
        </div>
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
