import { useCallback, useEffect, useState } from 'react';
import { DAYS } from './content/program';
import { WorkoutProvider, useWorkout } from './domain/WorkoutContext';
import { dayIncompleteSets, dayReps, dayStats, dayTonnage, nextDay, progressionExercises } from './domain/state';
import type { HelpKey, Screen, SummaryData } from './domain/types';
import { useRestTimer } from './hooks/useRestTimer';
import { useWakeLock } from './hooks/useWakeLock';
import { formatClock } from './utils/format';
import { parseYouTubeUrl, type YouTubeVideo } from './utils/youtube';
import { Confetti } from './components/Confetti';
import { CycleScreen } from './components/CycleScreen';
import { DayScreen } from './components/DayScreen';
import { HomeScreen } from './components/HomeScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { BottomNav, SessionBar } from './components/Navigation';
import { Overlays, type WeightContext } from './components/Overlays';
import { RestTimer } from './components/RestTimer';
import { Toast } from './components/Sheet';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function App() {
  return (
    <WorkoutProvider>
      <WorkoutApp />
    </WorkoutProvider>
  );
}

function WorkoutApp() {
  const { state, recovered, finishDay, setWeight } = useWorkout();
  const [screen, setScreen] = useState<Screen>('home');
  const [currentDay, setCurrentDay] = useState(1);
  const [toast, setToast] = useState('');
  const [helpKey, setHelpKey] = useState<HelpKey | null>(null);
  const [weightContext, setWeightContext] = useState<WeightContext | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [video, setVideo] = useState<YouTubeVideo | null>(null);
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const restTimer = useRestTimer();
  const requestWakeLock = useWakeLock();

  useEffect(() => {
    document.body.classList.toggle('on-day', screen === 'day');
    window.scrollTo(0, 0);
  }, [screen]);

  useEffect(() => {
    if (!recovered) return;
    const timer = window.setTimeout(() => setToast('Повреждённый журнал был восстановлен'), 600);
    return () => window.clearTimeout(timer);
  }, [recovered]);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback((message: string) => setToast(message), []);
  const celebrate = useCallback(() => setConfettiTrigger((value) => value + 1), []);
  const closeSheets = useCallback(() => {
    setHelpKey(null);
    setWeightContext(null);
    setSummary(null);
  }, []);

  const openDay = useCallback((day: number) => {
    if (day < 1 || day > DAYS.length) return;
    setCurrentDay(day);
    setScreen('day');
  }, []);

  const navigate = useCallback((nextScreen: Screen) => {
    if (nextScreen === 'day') {
      openDay(nextDay(state) ?? DAYS.length);
    } else {
      setScreen(nextScreen);
    }
  }, [openDay, state]);

  const changeDay = useCallback((day: number) => {
    if (day < 1) {
      showToast('Первая тренировка цикла');
      return;
    }
    if (day > DAYS.length) {
      showToast('Последняя — дальше новая программа');
      return;
    }
    setCurrentDay(day);
  }, [showToast]);

  const openHelp = useCallback((key: HelpKey) => {
    setSummary(null);
    setWeightContext(null);
    setHelpKey(key);
  }, []);

  const openVideo = useCallback((url: string) => {
    const parsed = parseYouTubeUrl(url);
    if (!parsed) {
      showToast('Не удалось открыть ссылку на видео');
      return;
    }
    setVideo(parsed);
  }, [showToast]);
  const closeVideo = useCallback(() => setVideo(null), []);

  const openWeight = useCallback((exercise: number, set: number, weight: number | null) => {
    setHelpKey(null);
    setWeightContext({ day: currentDay, exercise, set, weight });
  }, [currentDay]);

  const saveWeight = useCallback((weight: number | null) => {
    if (weightContext) setWeight(weightContext.day, weightContext.exercise, weightContext.set, weight);
    setWeightContext(null);
  }, [setWeight, weightContext]);

  const completeDay = useCallback(() => {
    const stats = dayStats(state, currentDay);
    if (stats.done < stats.total) {
      showToast(`Осталось отметить ${stats.total - stats.done} подходов`);
      return;
    }
    const record = state.days[String(currentDay)];
    const data: SummaryData = {
      day: currentDay,
      tonnage: dayTonnage(state, currentDay),
      done: stats.done,
      total: stats.total,
      reps: dayReps(state, currentDay),
      incompleteSets: dayIncompleteSets(state, currentDay),
      time: record?.startedAt ? formatClock((Date.now() - record.startedAt) / 1000) : '—',
      progression: progressionExercises(state, currentDay),
    };
    finishDay(currentDay);
    setSummary(data);
  }, [currentDay, finishDay, showToast, state]);

  const returnHomeFromSummary = useCallback(() => {
    const completesCycle = currentDay === DAYS.length && nextDay(state) === currentDay;
    closeSheets();
    setScreen('home');
    if (completesCycle) setMilestoneOpen(true);
  }, [closeSheets, currentDay, state]);

  const onOpenCycle = useCallback(() => setScreen('cycle'), []);
  const onBack = useCallback(() => setScreen('home'), []);
  const onInstall = useCallback(async () => {
    if (!installPrompt) {
      showToast('Открой меню Chrome → Установить приложение');
      return;
    }
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }, [installPrompt, showToast]);
  const onStartRest = useCallback((seconds: number) => restTimer.start(seconds), [restTimer.start]);
  const onRequestWakeLock = useCallback(() => { void requestWakeLock(); }, [requestWakeLock]);

  const stats = dayStats(state, currentDay);
  const tonnage = dayTonnage(state, currentDay);
  const finished = Boolean(state.days[String(currentDay)]?.finished);
  const anySheetOpen = Boolean(helpKey || weightContext || summary || milestoneOpen);

  return (
    <>
      <HomeScreen visible={screen === 'home'} onOpenDay={openDay} onOpenCycle={onOpenCycle} onToast={showToast} onCelebrate={celebrate} />
      <CycleScreen visible={screen === 'cycle'} onOpenDay={openDay} onToast={showToast} />
      <ProfileScreen visible={screen === 'profile'} canInstall={Boolean(installPrompt)} onInstall={onInstall} onToast={showToast} />
      <DayScreen visible={screen === 'day'} day={currentDay} onBack={onBack} onDayChange={changeDay} onOpenHelp={openHelp} onOpenWeight={openWeight} onOpenVideo={openVideo} onStartRest={onStartRest} onRequestWakeLock={onRequestWakeLock} />
      <BottomNav screen={screen} onNavigate={navigate} />
      <SessionBar visible={screen === 'day'} done={stats.done} total={stats.total} tonnage={tonnage} finished={finished} onFinish={completeDay} onOpenHelp={() => openHelp('tonnage')} />
      <RestTimer timer={restTimer} onOpenHelp={() => openHelp('rest')} />
      <Overlays scrimOpen={anySheetOpen} onClose={closeSheets} weightContext={weightContext} onSaveWeight={saveWeight} helpKey={helpKey} summary={summary} video={video} onCloseVideo={closeVideo} milestoneOpen={milestoneOpen} onCloseMilestone={() => setMilestoneOpen(false)} onHomeFromSummary={returnHomeFromSummary} onToast={showToast} />
      <Confetti trigger={confettiTrigger} />
      <Toast message={toast} />
    </>
  );
}
