// Проверка контраста обеих тем по WCAG 2.1 (AA).
// Читает токены прямо из src/styles.css — чтобы скрипт не расходился с реальностью.
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

function tokensOf(selector) {
  const block = css.match(new RegExp(`${selector.replace(/[[\]()]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
  const out = {};
  for (const line of block.split(';')) {
    const m = line.match(/--([\w-]+)\s*:\s*(#[0-9A-Fa-f]{3,8})/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const lum = (hex) => {
  const c = hex.replace('#', '').match(/../g).map((h) => { const v = parseInt(h, 16) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const cr = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };

// Поверхности, на которых лежит обычный текст.
// --btn-bg сюда НЕ входит: на заливке кнопки живёт только --btn-ink (проверяется отдельно в INK).
const SURFACES = ['bg', 'surface', 'elevated'];
// пары «текстовый токен → фоны» и минимальное требование WCAG AA
const CHECKS = [
  ['основной текст', 'text', 4.5],
  ['вторичный текст', 'dim', 4.5],
  ['подписи, микротекст', 'faint', 4.5],
  ['акцент как текст', 'lime', 4.5],
  ['успех как текст', 'success', 4.5],
  ['предупреждение как текст', 'warn', 4.5],
  ['инфо как текст', 'blue', 4.5],
];
// пары «ink на заливке» — заливка сама играет роль фона
const INK = [
  ['текст на кнопке', 'btn-ink', 'btn-bg'],
  ['текст на success', 'success-ink', 'success'],
  ['текст на фоне week-done', 'success-ink', 'success'],
];

let failures = 0;
for (const [attr, label] of [['dark', 'ТЁМНАЯ'], ['light', 'СВЕТЛАЯ']]) {
  const t = tokensOf(`[data-theme="${attr}"]`);
  console.log(`\n=== ${label} (${attr}) ===`);
  for (const [name, fg, need] of CHECKS) {
    if (!t[fg]) { console.log(` SKIP  ${name}: токен --${fg} не найден`); continue; }
    let worst = Infinity, worstOn = '';
    for (const bgKey of SURFACES) {
      if (!t[bgKey]) continue;
      const v = cr(t[fg], t[bgKey]);
      if (v < worst) { worst = v; worstOn = bgKey; }
    }
    const ok = worst >= need;
    if (!ok) failures += 1;
    console.log(`${ok ? '  OK  ' : ' FAIL '} ${name.padEnd(24)} ${worst.toFixed(2).padStart(5)} на --${worstOn.padEnd(8)} нужно ${need}`);
  }
  for (const [name, ink, fill] of INK) {
    if (!t[ink] || !t[fill]) continue;
    const v = cr(t[ink], t[fill]);
    const ok = v >= 4.5;
    if (!ok) failures += 1;
    console.log(`${ok ? '  OK  ' : ' FAIL '} ${name.padEnd(24)} ${v.toFixed(2).padStart(5)}`);
  }
}

console.log(`\nИТОГО нарушений контраста: ${failures}`);
process.exit(failures ? 1 : 0);
