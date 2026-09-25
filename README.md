# МЕЗО · Тренировочный трекер

Основной проект переведён на React + TypeScript + Vite.

## Команды

```bash
npm install
npm run dev
npm test
npm run build
npm run preview
```

Для разработки:

```bash
npm run dev -- --host 0.0.0.0
```

После этого приложение будет доступно в локальной сети на порту, который покажет Vite.

## Структура

```text
src/
├── components/   UI-компоненты экранов и bottom sheet
├── content/      программа тренировок и тексты справки
├── domain/       типы, reducer, вычисления и localStorage
├── hooks/        таймер отдыха и Wake Lock
├── test/         unit-тесты состояния, storage и контента
├── utils/        форматирование и мышечные группы
├── App.tsx
├── main.tsx
└── styles.css
```

## GitHub Pages

В репозитории есть автоматическая публикация основного Vite-приложения через GitHub Actions:

```text
.github/workflows/pages.yml
```

После push в ветку `main` сайт будет собран и опубликован в GitHub Pages. URL появится в разделе **Actions** конкретного workflow и в настройках репозитория **Settings → Pages**.

## PWA

Готовый PWA-вариант находится отдельно в:

```text
pwa/
```

Он не зависит от Vite и содержит собственный `manifest.webmanifest` и `service-worker.js`.

Журнал хранится в `localStorage` под ключом:

```text
meso.classic-split.v1
```

Состояние автоматически нормализуется при загрузке.
