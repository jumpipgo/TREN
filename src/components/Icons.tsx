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

export function ProfileIcon({ size = 19 }: IconProps) {
  return <svg {...base(size)}><circle cx="12" cy="8" r="3.2"/><path d="M5 20c.7-3.5 3.1-5.2 7-5.2s6.3 1.7 7 5.2"/></svg>;
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

export function ThemeIcon({ theme }: { theme: 'dark' | 'light' }) {
  // Обе иконки штриховые и живут в currentColor, поэтому следуют за темой.
  return theme === 'dark' ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.6v2.2M12 19.2v2.2M4.3 4.3l1.6 1.6M18.1 18.1l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.3 19.7l1.6-1.6M18.1 5.9l1.6-1.6" />
    </svg>
  );
}

export function LockIcon({ size = 19 }: IconProps) {
  return <svg {...base(size)}><rect x="4.5" y="10.5" width="15" height="9.5" rx="2.4" /><path d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9" /></svg>;
}

export function ExportIcon({ size = 19 }: IconProps) {
  return <svg {...base(size)}><path d="M12 15.5V4.2" /><path d="M8.2 7.8 12 4l3.8 3.8" /><path d="M4.5 14.5v3.9a1.6 1.6 0 0 0 1.6 1.6h11.8a1.6 1.6 0 0 0 1.6-1.6v-3.9" /></svg>;
}

export function ImportIcon({ size = 19 }: IconProps) {
  return <svg {...base(size)}><path d="M12 4v11.3" /><path d="M8.2 11.7 12 15.5l3.8-3.8" /><path d="M4.5 14.5v3.9a1.6 1.6 0 0 0 1.6 1.6h11.8a1.6 1.6 0 0 0 1.6-1.6v-3.9" /></svg>;
}

export function InstallIcon({ size = 19 }: IconProps) {
  return <svg {...base(size)}><rect x="6.5" y="2.8" width="11" height="18.4" rx="2.4" /><path d="M12 7.4v6.2" /><path d="M9.4 11.2 12 13.8l2.6-2.6" /></svg>;
}

export function TrashIcon({ size = 19 }: IconProps) {
  return <svg {...base(size)}><path d="M4.6 6.6h14.8" /><path d="M9.4 6.6V4.8a1.2 1.2 0 0 1 1.2-1.2h2.8a1.2 1.2 0 0 1 1.2 1.2v1.8" /><path d="M6.6 6.6l.9 12.1a1.6 1.6 0 0 0 1.6 1.5h5.8a1.6 1.6 0 0 0 1.6-1.5l.9-12.1" /><path d="M10.4 10.2v6M13.6 10.2v6" /></svg>;
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
