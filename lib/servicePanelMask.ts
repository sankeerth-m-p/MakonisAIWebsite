let seamX: number | null = null;

const listeners = new Set<(nextSeamX: number | null) => void>();
const targets = new Set<HTMLElement>();

function applyRightPanelMask(el: HTMLElement, rightInsetPercent: number) {
  const right = Math.max(0, Math.min(100, rightInsetPercent));

  if (right <= 0) {
    el.style.removeProperty("clip-path");
    el.style.removeProperty("-webkit-clip-path");
    return;
  }

  const clip = `inset(0% ${right}% 0% 0%)`;
  el.style.clipPath = clip;
  el.style.setProperty("-webkit-clip-path", clip);
}

function syncTarget(el: HTMLElement) {
  if (seamX == null) {
    el.style.removeProperty("clip-path");
    el.style.removeProperty("-webkit-clip-path");
    return;
  }
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0) return;

  const rightInset = ((rect.right - seamX) / rect.width) * 100;
  applyRightPanelMask(el, rightInset);
}

export function publishServicePanelSeam(nextSeamX: number | null) {
  seamX = nextSeamX;
  listeners.forEach((listener) => listener(seamX));
  targets.forEach((target) => syncTarget(target));
}

export function subscribeServicePanelSeam(
  listener: (nextSeamX: number | null) => void,
) {
  listeners.add(listener);
  listener(seamX);
  return () => {
    listeners.delete(listener);
  };
}

export function registerServicePanelRevealTarget(el: HTMLElement) {
  targets.add(el);
  syncTarget(el);
  return () => {
    targets.delete(el);
    el.style.removeProperty("clip-path");
    el.style.removeProperty("-webkit-clip-path");
  };
}
