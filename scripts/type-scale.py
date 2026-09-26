#!/usr/bin/env python3
"""Переводит размеры шрифта в styles.css на токены шкалы --fs-*.

Карта соответствий (выбрана ближайшая ступень, чтобы правка не ломала вёрстку):
  8, 9, 10, 10.5 -> 10   служебные подписи
  11 -> 11
  11.5, 12, 12.5 -> 12
  13 -> 13
  13.5, 14 -> 14
  14.5, 15 -> 15
  16 -> 16              базовый
  17, 18 -> 17
  19, 20, 21, 22 -> 20
  24 -> 24
  26, 28 -> 30
  46 -> 46
  58 -> 58
"""
import io
import re
import sys

MAP = {
    '8': '10', '9': '10', '10': '10', '10.5': '10',
    '11': '11',
    '11.5': '12', '12': '12', '12.5': '12',
    '13': '13',
    '13.5': '14', '14': '14',
    '14.5': '15', '15': '15',
    '16': '16',
    '17': '17', '18': '17',
    '19': '20', '20': '20', '21': '20', '22': '20',
    '24': '24',
    '26': '30', '28': '30',
    '30': '30',
    '46': '46',
    '58': '58',
}

path = 'src/styles.css'
src = io.open(path, encoding='utf-8').read()
before_short, before_long = len(src), 0

# Заменяем только объявления размеров: font:<weight> <N>px и font-size:<N>px
font_shorthand = re.compile(r'(font:)(\d{3}) ([\d.]+)(px)')
font_size_prop = re.compile(r'(font-size:)([\d.]+)(px)')


def repl_shorthand(m):
    weight, size = m.group(2), m.group(3)
    if size not in MAP:
        return m.group(0)
    return f'{m.group(1)}{weight} var(--fs-{MAP[size]})'


def repl_size(m):
    size = m.group(2)
    if size not in MAP:
        return m.group(0)
    return f'{m.group(1)}var(--fs-{MAP[size]})'


out = font_shorthand.sub(repl_shorthand, src)
out = font_size_prop.sub(repl_size, out)
# clamp(<N>px,<N>vw,<N>px) — внутри них px тоже нужно перевести
def repl_clamp(m):
    parts = m.group(1).split(',')
    new = []
    for p in parts:
        mm = re.match(r'\s*([\d.]+)px\s*$', p)
        if mm and mm.group(1) in MAP:
            new.append(f' var(--fs-{MAP[mm.group(1)]})')
        else:
            new.append(p)
    return 'clamp(' + ','.join(new) + ')'


out = re.sub(r'clamp\(([^()]*)\)', repl_clamp, out)

io.open(path, 'w', encoding='utf-8').write(out)

left = re.findall(r'(?:font:\d{3} |font-size:)\s*([\d.]+)px', out)
print('заменено символов:', before_short - len(out))
print('осталось «сырых» размеров в px:', left if left else 'нет')
if re.search(r'font:\d{3} [\d.]+px|font-size:[\d.]+px', out):
    print('ВНИМАНИЕ: остались незаменённые объявления')
    for line in out.splitlines():
        if re.search(r'font:\d{3} [\d.]+px|font-size:[\d.]+px', line):
            print('   ', line.strip()[:110])
    sys.exit(1)
