export function formatWeight(weight: number | null | undefined): string {
  if (weight == null || Number(weight) <= 0) return '—';
  return Number.isInteger(weight)
    ? String(weight)
    : String(Number(weight.toFixed(2))).replace('.', ',');
}

export function formatNumber(value: number): string {
  return Number(value || 0).toLocaleString('ru-RU');
}

export function formatKg(value: number): string {
  const rounded = Math.round((Number(value) || 0) * 100) / 100;
  return rounded.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function vibrate(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Haptics are optional and may be blocked by the browser.
  }
}
