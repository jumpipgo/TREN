#!/usr/bin/env python3
"""Разворачивает сокращение `font` в перечисленные свойства.

Причина: Chromium отбрасывает `font:600 var(--fs-13)` целиком — var() в
сокращении font не даёт браузеру разобрать обязательный <font-size>, и
правило не применяется вообще (проверено в CDP: fontSize остаётся 16px).
Поэтому шкала объявлена как токены, а каждое правило перечисляет
font-weight / font-size / line-height / font-family явно.
"""
import io
import re
import sys

path = 'src/styles.css'
src = io.open(path, encoding='utf-8').read()

# font:<weight> <size>[/<lh>] var(--font-*)
# size — либо var(--fs-N), либо clamp(...) из токенов
# Размер: либо var(--fs-N), либо clamp(...) с вложенными var() — учитываем скобки на любой глубине
SIZE = r'(var\(--fs-\d+\)|clamp\((?:[^()]|\([^()]*\))*\))'
with_family = re.compile(rf'font:(\d{3}) {SIZE}(/([\d.]+))? var\(--(font-[\w-]+)\)')
# font:<weight> <size>[/<lh>]  — без семейства
plain = re.compile(rf'font:(\d{3}) {SIZE}(/([\d.]+))?')


def expand(match):
    weight, size = match.group(1), match.group(2)
    slash = match.group(3) or ''
    lh = match.group(4) if '/' in slash else None
    family = match.group(5) if match.lastindex and match.lastindex >= 5 else None
    parts = [f'font-weight:{weight}', f'font-size:{size}']
    if lh is not None:
        parts.append(f'line-height:{lh}')
    if family is not None:
        parts.append(f'font-family:var(--{family})')
    return ';'.join(parts)


out = src
out = with_family.sub(expand, out)
out = plain.sub(expand, out)

io.open(path, 'w', encoding='utf-8').write(out)

left = re.findall(r'font:\s*\d{3}[^;{]*(?:var\(--fs-|clamp\()', out)
print('осталось сокращений font с токенами:', len(left))
if left:
    for line in out.splitlines():
        if re.search(r'font:\s*\d{3}[^;{]*(?:var\(--fs-|clamp\()', line):
            print('   ', line.strip()[:120])
    sys.exit(1)
