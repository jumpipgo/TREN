interface IconProps {
  className?: string;
  size?: number;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function HomeIcon({ size = 19 }: IconProps) {
  return <svg {...base(size)}><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/></svg>;
}

export function CycleIcon({ size = 19 }: IconProps) {
  return <svg {...base(size)} strokeWidth={2.2}><path d="M5 6h14M5 12h9M5 18h14"/></svg>;
}

export function WorkoutIcon({ size = 19 }: IconProps) {
  return <svg {...base(size)}><path d="M2.5 12h2.5M19 12h2.5"/><rect x="5" y="8.2" width="2.6" height="7.6" rx="1.1"/><rect x="16.4" y="8.2" width="2.6" height="7.6" rx="1.1"/><path d="M7.6 12h8.8"/></svg>;
}

export function CheckIcon({ size = 13 }: IconProps) {
  return <svg {...base(size)} strokeWidth={3.2}><path d="M4 12.5l5 5L20 6.5"/></svg>;
}

export function PlayIcon({ size = 10 }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor"><path d="M2 1.2v9.6L11 6z"/></svg>;
}

export function ArrowIcon({ size = 15 }: IconProps) {
  return <svg {...base(size)} strokeWidth={2.2}><path d="M9 5l7 7-7 7"/></svg>;
}

export function BackIcon({ size = 17 }: IconProps) {
  return <svg {...base(size)} strokeWidth={2.2}><path d="M15 5l-7 7 7 7"/></svg>;
}

export function ThemeIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>;
}

export function PrintIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/></svg>;
}

export function PauseIcon({ paused = false }: { paused?: boolean }) {
  return paused
    ? <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1.2v9.6L11 6z"/></svg>
    : <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="1.5" width="2.6" height="9" rx="1"/><rect x="7.4" y="1.5" width="2.6" height="9" rx="1"/></svg>;
}

export function MuscleIcon({ asset, size = 18 }: { asset: string; size?: number }) {
  return <span className="muscle-asset" style={{ width: size, height: size, WebkitMaskImage: `url(${asset})`, maskImage: `url(${asset})` }} aria-hidden="true" />;
}
