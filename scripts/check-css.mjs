/**
 * Проверка целостности CSS.
 *
 * Зачем: браузер восстанавливается после синтаксической ошибки молча — одно
 * правило пропадает, остальные работают. Так «умерло» правило `.choice`
 * (position:fixed), и окно выбора повторов уезжало вниз на всю высоту
 * списка подходов вместо низа экрана. Ни один чек это не замечал.
 *
 * Ищем:
 *  — лишние `}` вне блока (главный источник тихой потери правил);
 *  — незакрытые блоки в конце файла;
 *  — прелюдии без селектора (обрывки удалённых @keyframes вроде `50%{…}}`).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, '..', 'src', 'styles.css');
const source = readFileSync(file, 'utf8');

const problems = [];
const stack = [];
let line = 1;
let prelude = '';
let inString = null;
let inComment = false;
let commentStart = 0;
let atRule = false;

for (let i = 0; i < source.length; i += 1) {
  const ch = source[i];
  const next = source[i + 1];
  if (ch === '\n') line += 1;

  if (inComment) {
    if (ch === '*' && next === '/') { inComment = false; i += 1; }
    continue;
  }
  if (inString) {
    if (ch === '\\') { i += 1; continue; }
    if (ch === inString) inString = null;
    continue;
  }
  if (ch === '/' && next === '*') { inComment = true; commentStart = line; i += 1; continue; }
  if (ch === '"' || ch === "'") { inString = ch; continue; }

  if (ch === '{') {
    atRule = prelude.trim().startsWith('@');
    stack.push({ line, prelude: prelude.trim(), atRule });
    prelude = '';
    continue;
  }
  if (ch === '}') {
    if (!stack.length) {
      problems.push(`строка ${line}: лишняя «}» вне блока — браузер потеряет следующее правило`);
    } else {
      stack.pop();
    }
    prelude = '';
    continue;
  }
  if (ch === ';') { prelude = ''; continue; }
  prelude += ch;
  void atRule;
}

for (const open of stack) {
  problems.push(`строка ${open.line}: не закрыт блок «${open.prelude.slice(0, 40)}»`);
}

if (problems.length) {
  console.error('ИТОГО проблем в CSS: ' + problems.length);
  for (const text of problems) console.error('  ' + text);
  process.exit(1);
}

console.log('CSS цел: лишних скобок нет, все блоки закрыты (проверено ' + source.split('\n').length + ' строк)');
