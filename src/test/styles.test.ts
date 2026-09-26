import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', 'styles.css'), 'utf8');

/**
 * Регрессия: обрывок удалённого @keyframes («50%{…}}») перед правилом `.choice`
 * ронял его при разборе браузером — окно выбора повторов переставало быть
 * position:fixed и уезжало вниз на всю высоту списка подходов.
 * Синтаксис ловит scripts/check-css.mjs, здесь — сам смысл правила.
 */
describe('стили окна выбора повторов', () => {
  const rule = css.match(/\.choice\s*\{([^}]*)\}/)?.[1] ?? '';

  it('окно выбора закреплено на весь экран', () => {
    expect(rule).toContain('position:fixed');
    expect(rule).toContain('inset:0');
  });

  it('панель выбора не выше экрана', () => {
    const panel = css.match(/\.choice-panel\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(panel).toContain('max-height:92vh');
    expect(panel).toContain('overflow-y:auto');
  });

  it('в полях нет кнопок «+»/«−» (stepper удалён)', () => {
    expect(css).not.toContain('.stepper');
    expect(css).not.toContain('.step-btn');
    expect(css).not.toMatch(/^\.st\s*\{/m);
  });

  it('жест колесом остался только у веса', () => {
    // ровно одно место с touch-action:none — циферблат веса в шторке
    expect(css.match(/touch-action:none/g) ?? []).toHaveLength(1);
    const wheel = css.match(/\.wheel\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(wheel).toContain('touch-action:none');
  });
});
