/**
 * Держит активное поле ввода над клавиатурой.
 *
 * На мобильных при фокусе input браузер поднимает клавиатуру, и нижние
 * панели приложения (#sbar, #nav) перекрывают поле. Проверка повторяется
 * трижды: на первом кадре, через 180 мс и через 420 мс — высота клавиатуры
 * на Android и iOS становится известна не сразу.
 *
 * bottomInset — сколько снизу занимают панели приложения плюс сама клавиатура.
 */
export function keepFieldVisible(element: HTMLElement | null, bottomInset = 160): void {
  if (!element) return;

  const reveal = () => {
    const top = element.getBoundingClientRect().top;
    const limit = window.innerHeight - bottomInset;
    if (top > limit - 16 || top < 64) {
      window.scrollBy({
        top: Math.max(0, top - limit + 72),
        behavior: 'smooth',
      });
    }
  };

  requestAnimationFrame(reveal);
  window.setTimeout(reveal, 180);
  window.setTimeout(reveal, 420);
}

/** Ставит фокус без автоскролла браузера и сразу поднимает поле над панелями. */
export function focusField(element: HTMLElement | null, bottomInset = 160): void {
  if (!element) return;
  element.focus({ preventScroll: true });
  keepFieldVisible(element, bottomInset);
}
