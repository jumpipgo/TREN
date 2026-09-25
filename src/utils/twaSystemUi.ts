const TWA_ORIGIN = 'https://jumpipgo.github.io';

let nativePort: MessagePort | null = null;
let lastScrollY = 0;
let scrollFrame = 0;
let statusBarVisible: boolean | null = null;

function sendStatusBar(visible: boolean) {
  if (!nativePort || statusBarVisible === visible) return;
  statusBarVisible = visible;
  nativePort.postMessage(visible ? 'system-ui:show' : 'system-ui:hide');
}

function handleNativeMessage(event: MessageEvent) {
  if (event.origin !== TWA_ORIGIN || !event.ports[0]) return;
  nativePort = event.ports[0];
  nativePort.start();
}

function handleScroll() {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    const y = window.scrollY;
    const delta = y - lastScrollY;
    lastScrollY = y;

    if (y <= 8 || delta < -6) sendStatusBar(true);
    else if (delta > 6) sendStatusBar(false);
    scrollFrame = 0;
  });
}

/** Connects the web app to the native TWA system-bar controller. */
export function initTwaSystemUi() {
  lastScrollY = window.scrollY;
  window.addEventListener('message', handleNativeMessage);
  window.addEventListener('scroll', handleScroll, { passive: true });
}
