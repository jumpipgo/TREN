import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { vibrate } from '../utils/format';

/**
 * Ввод числа жестом «колесо» — без системной клавиатуры.
 *
 * Зачем: на тренировке поле повторов открывает клавиатуру 18 раз, и каждый
 * вызов сдвигает вёрстку, закрывает половину экрана и требует убирать руки
 * от телефона. Проведение пальцем вверх/вниз по полю меняет значение
 * целыми шагами, как в iOS.
 *
 * На устройствах с мышью (pointer: fine) жест отключён — там обычный ввод
 * с клавиатуры удобнее и ожидаемее.
 */

export function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}

/** Пояснение про колесо показывается один раз за сессию, а не на каждый подход. */
let gestureExplained = false;

interface WheelOptions {
  value: number | null;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step: number;
  /** Сколько пикселей по вертикали нужно провести для одного шага. */
  pixelsPerStep?: number;
  /** Сообщает компоненту, что палец на колесе — чтобы показать подсказку. */
  onDragState?: (dragging: boolean) => void;
  /** Сообщает о первом касании колеса за сессию. */
  onFirstDrag?: () => void;
}

export interface WheelField {
  handlers: {
    onPointerDown: (event: React.PointerEvent) => void;
    onPointerMove: (event: React.PointerEvent) => void;
    onPointerUp: (event: React.PointerEvent) => void;
    onPointerCancel: (event: React.PointerEvent) => void;
    onWheel: (event: React.WheelEvent) => void;
  };
  /** true, если последнее касание было колесом, а не тапом по панели выбора. */
  wasDrag: () => boolean;
  clearDrag: () => void;
}

export function useWheelNumber({
  value,
  onChange,
  min,
  max,
  step,
  pixelsPerStep = 16,
  onDragState,
  onFirstDrag,
}: WheelOptions): WheelField {
  // pending — нерастраченные пиксели: без них медленное движение,
  // меньше одного шага за кадр, никогда не меняет значение.
  const drag = useRef<{ id: number; lastY: number; pending: number; value: number } | null>(null);
  const dragged = useRef(false);

  useEffect(() => () => { drag.current = null; }, []);

  const clamp = useCallback((next: number) => {
    const safe = Number.isFinite(next) ? next : min;
    return Math.min(Math.max(safe, min), max);
  }, [min, max]);

  const apply = useCallback((next: number) => {
    const safe = clamp(next);
    if (safe !== value) {
      onChange(safe);
      vibrate(8);
    }
  }, [clamp, onChange, value]);

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    if (!isTouchDevice()) return;
    dragged.current = false;
    drag.current = {
      id: event.pointerId,
      lastY: event.clientY,
      pending: 0,
      value: value ?? min,
    };
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    onDragState?.(true);
    onFirstDrag?.();
  }, [min, onDragState, onFirstDrag, value]);

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    state.pending += state.lastY - event.clientY;
    state.lastY = event.clientY;
    if (Math.abs(state.pending) < 4) return;
    dragged.current = true;
    event.preventDefault();

    const steps = Math.trunc(state.pending / pixelsPerStep);
    if (steps === 0) return;
    state.pending -= steps * pixelsPerStep;
    state.value = clamp(state.value + steps * step);
    apply(state.value);
  }, [apply, clamp, pixelsPerStep, step]);

  const endDrag = useCallback((event: React.PointerEvent) => {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    onDragState?.(false);
  }, [onDragState]);

  const onWheel = useCallback((event: React.WheelEvent) => {
    if (isTouchDevice()) return;
    dragged.current = true;
    event.preventDefault();
    apply((value ?? min) + (event.deltaY > 0 ? -step : step));
  }, [apply, min, step, value]);

  return {
    handlers: { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag, onWheel },
    wasDrag: () => dragged.current,
    clearDrag: () => { dragged.current = false; },
  };
}

interface NumberWheelFieldProps {
  value: number | null;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Сколько пикселей по вертикали нужно провести для одного шага. */
  pixelsPerStep?: number;
  className?: string;
  placeholder?: string;
  format?: (value: number) => string;
  ariaLabel: string;
  /** Дополнительный класс по состоянию значения (пусто / верх / низ коридора). */
  stateClass?: (value: number | null) => string;
  id?: string;
  onOpenChoices?: () => void;
  /** Вызывается один раз за сессию, при первом касании колеса. */
  onFirstDrag?: () => void;
  /** Единица измерения рядом со значением, например «кг». */
  unit?: string;
  children?: ReactNode;
}

/**
 * Поле-«колесо»: значение меняется жестом, тап открывает быстрый выбор.
 * Системная клавиатура не вызывается никогда.
 */
export function NumberWheelField({
  value,
  onChange,
  min,
  max,
  step = 1,
  pixelsPerStep,
  className = '',
  placeholder,
  format = (v) => String(v),
  ariaLabel,
  stateClass = () => '',
  id,
  onOpenChoices,
  onFirstDrag,
  unit,
  children,
}: NumberWheelFieldProps) {
  const [dragging, setDragging] = useState(false);
  const touch = isTouchDevice();

  const wheel = useWheelNumber({
    value,
    onChange,
    min,
    max,
    step,
    pixelsPerStep,
    onDragState: setDragging,
    onFirstDrag: () => {
      if (gestureExplained || !onFirstDrag) return;
      gestureExplained = true;
      onFirstDrag();
    },
  });

  return (
    <div
      id={id}
      className={`wheel ${className} ${value != null ? 'wheel-own' : ''} ${stateClass(value)} ${touch ? 'wheel-touch' : ''} ${dragging ? 'is-dragging' : ''}`}
      role="spinbutton"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuenow={value ?? undefined}
      aria-valuemin={min}
      aria-valuemax={max}
      onClick={() => {
        if (wheel.wasDrag()) { wheel.clearDrag(); return; }
        onOpenChoices?.();
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowUp') { event.preventDefault(); onChange(Math.min(max, (value ?? min) + step)); }
        if (event.key === 'ArrowDown') { event.preventDefault(); onChange(Math.max(min, (value ?? min) - step)); }
      }}
      {...wheel.handlers}
    >
      <span className="wheel-val">{value != null ? format(value) : (placeholder ?? `${min}–${max}`)}</span>
      {value != null && unit && <small className="wheel-unit">{unit}</small>}
      {children}
    </div>
  );
}
