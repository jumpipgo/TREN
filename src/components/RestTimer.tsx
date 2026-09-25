import type { useRestTimer } from '../hooks/useRestTimer';
import { PauseIcon } from './Icons';

type RestTimerController = ReturnType<typeof useRestTimer>;

interface RestTimerProps {
  timer: RestTimerController;
  onOpenHelp: () => void;
}

export function RestTimer({ timer, onOpenHelp }: RestTimerProps) {
  const progress = timer.total ? Math.max(0, Math.min(1, timer.left / timer.total)) : 0;
  const dashOffset = 100.53 * (1 - progress);
  return (
    <div id="tpill" className={`${timer.shown ? 'show' : ''} ${timer.over ? 'over' : ''}`} role="timer" aria-label="Таймер отдыха">
      <button className="tinfo" onClick={onOpenHelp} aria-label="Справка: таймер отдыха">
        <svg className="tpr" viewBox="0 0 40 40"><circle className="bgc" cx="20" cy="20" r="16"/><circle className="fgc" cx="20" cy="20" r="16" strokeDasharray="100.5" strokeDashoffset={dashOffset}/></svg>
        <b id="tTime">{timer.display}</b>
        <i className="qm" aria-hidden="true">?</i>
      </button>
      <button className="tbtn" id="tAdd" onClick={timer.addThirty}>+30</button>
      <button className="tbtn" id="tPause" onClick={timer.togglePause} aria-label={timer.running ? 'Пауза' : 'Продолжить'}><PauseIcon paused={!timer.running} /></button>
      <button className="tbtn" id="tClose" onClick={timer.close} aria-label="Скрыть таймер">×</button>
    </div>
  );
}
