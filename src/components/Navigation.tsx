import type { Screen } from '../domain/types';
import { CycleIcon, HomeIcon, WorkoutIcon } from './Icons';

interface BottomNavProps {
  screen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function BottomNav({ screen, onNavigate }: BottomNavProps) {
  return (
    <nav id="nav" aria-label="Разделы">
      <button className={`nav-btn ${screen === 'home' ? 'on' : ''}`} data-s="home" onClick={() => onNavigate('home')}><HomeIcon /><small>Сегодня</small></button>
      <button className={`nav-btn ${screen === 'cycle' ? 'on' : ''}`} data-s="cycle" onClick={() => onNavigate('cycle')}><CycleIcon /><small>Цикл</small></button>
      <button className={`nav-btn ${screen === 'day' ? 'on' : ''}`} data-s="day" onClick={() => onNavigate('day')}><WorkoutIcon /><small>Тренировка</small></button>
    </nav>
  );
}

interface SessionBarProps {
  visible: boolean;
  done: number;
  total: number;
  tonnage: number;
  finished: boolean;
  onFinish: () => void;
  onOpenHelp: () => void;
}

export function SessionBar({ visible, done, total, tonnage, finished, onFinish, onOpenHelp }: SessionBarProps) {
  return (
    <footer id="sbar" className={visible ? 'on' : ''}>
      <div className="sb-l">
        <b>{done}/{total}</b>
        <button className="sbt" onClick={onOpenHelp} aria-label="Справка: тоннаж"><span>Σ {tonnage.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} кг</span><i className="qm" aria-hidden="true">?</i></button>
      </div>
      <button id="btnFin" disabled={finished || done === 0 || done < total} onClick={onFinish}>{finished ? 'Завершено' : 'Завершить'}</button>
    </footer>
  );
}
