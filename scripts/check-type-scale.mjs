// Проверяет, что шкала типографики действительно используется, а не разъехалась.
// 1) все размеры шрифтов объявлены токенами --fs-*
// 2) в сокращении `font` нет var() — Chromium отбрасывает такое объявление целиком
// 3) каждый токен шкалы где-то используется (нет мёртвых ступеней)
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const problems = [];

// 1. объявленные ступени
const declared = [...css.matchAll(/--fs-(\d+):\s*([\d.]+px)/g)].map((m) => ({ step: m[1], value: m[2] }));
if (declared.length === 0) problems.push('шкала не объявлена: нет ни одного --fs-*');
const steps = declared.map((d) => Number(d.step));
const sorted = [...steps].sort((a, b) => a - b);
if (sorted.join(',') !== steps.join(',')) problems.push(`ступени объявлены не по возрастанию: ${steps.join(', ')}`);
for (const { step, value } of declared) {
  if (Number(step) !== Number.parseFloat(value)) problems.push(`--fs-${step} = ${value}, имя не совпадает со значением`);
}

// 2. сырые размеры в объявлениях шрифта
const rawSizes = [...css.matchAll(/(?:font:\d{3}\s+|font-size:)([\d.]+)px/g)].map((m) => m[1]);
if (rawSizes.length) {
  problems.push(`остались размеры без токенов (${rawSizes.length}): ${[...new Set(rawSizes)].join(', ')}`);
}

// 3. var() внутри сокращения font — правило отбрасывается целиком
const badShorthand = [...css.matchAll(/font:\d{3}[^;{]*(?:var\(--fs-|clamp\()/g)].map((m) => m[0].trim());
if (badShorthand.length) {
  problems.push(`var() в сокращении font (${badShorthand.length}): ${badShorthand.slice(0, 3).join(' | ')}`);
}

// 4. мёртвые ступени
for (const { step } of declared) {
  const uses = (css.match(new RegExp(`var\\(--fs-${step}\\)`, 'g')) || []).length;
  if (uses === 0) problems.push(`ступень --fs-${step} объявлена, но не используется`);
}

console.log(`Ступеней шкалы: ${declared.length} → ${declared.map((d) => d.value).join(' ')}`);
if (problems.length) {
  console.log('\nПРОБЛЕМЫ:');
  problems.forEach((p) => console.log('  - ' + p));
  process.exit(1);
}
console.log('Шкала типографики: нарушений 0');
