/**
 * Drives the reveal mask on fixed elements (e.g. the Navbar) so they clip
 * exactly at the sliding service-details panel's left edge.
 *
 * The panel animates via `transform: translateX`, while the mask is a
 * `clip-path` inset. Those two properties do NOT interpolate to the same
 * on-screen position mid-flight, so animating the clip-path with its own CSS
 * transition makes the mask visibly lag the panel. Instead — like doorReveal —
 * we read the panel's *live* left edge every animation frame and set the clip
 * seam to match it, guaranteeing perfect sync regardless of easing/duration.
 */

/** Keep in sync with the service details panel `transition-transform` classes. */
export const SERVICE_PANEL_TRANSITION_MS = 500;
export const SERVICE_PANEL_TRANSITION_EASING = "ease-out";

let isPanelOpen = false;
let panelEl: HTMLElement | null = null;
let rafId = 0;
let settleTimeout = 0;

const targets = new Set<HTMLElement>();

/** Screen-X of the mask seam: the panel's real left edge, or off-screen right when closed. */
function seamX() {
  if (isPanelOpen && panelEl) {
    return panelEl.getBoundingClientRect().left;
  }
  return window.innerWidth;
}

function applyRightPanelMask(el: HTMLElement, rightInsetPercent: number) {
  const right = Math.max(0, Math.min(100, rightInsetPercent));
  const clip = `inset(0% ${right}% 0% 0%)`;
  el.style.clipPath = clip;
  el.style.setProperty("-webkit-clip-path", clip);
}

function syncTarget(el: HTMLElement, seam: number) {
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0) {
    applyRightPanelMask(el, 0);
    return;
  }
  const rightInset = ((rect.right - seam) / rect.width) * 100;
  applyRightPanelMask(el, rightInset);
}

function syncAll() {
  const seam = seamX();
  targets.forEach((target) => syncTarget(target, seam));
}

/** Follow the panel's moving edge every frame for the duration of its transition. */
function runTracking() {
  if (rafId) cancelAnimationFrame(rafId);
  if (settleTimeout) clearTimeout(settleTimeout);

  const tick = () => {
    syncAll();
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);

  // Stop a frame after the panel settles so we're not looping forever.
  settleTimeout = window.setTimeout(() => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    settleTimeout = 0;
    syncAll();
  }, SERVICE_PANEL_TRANSITION_MS + 60);
}

/** Register the sliding panel whose left edge the mask should track. */
export function registerServicePanelElement(el: HTMLElement) {
  panelEl = el;
  return () => {
    if (panelEl === el) panelEl = null;
  };
}

export function publishServicePanelOpen(open: boolean) {
  isPanelOpen = open;
  runTracking();
}

/** Recompute mask geometry without animation (e.g. on resize). */
export function syncServicePanelMaskLayout() {
  if (!isPanelOpen) return;
  syncAll();
}

export function registerServicePanelRevealTarget(el: HTMLElement) {
  targets.add(el);
  // Mask is driven imperatively per-frame; no CSS transition needed here.
  el.style.transition = "none";
  syncTarget(el, seamX());
  return () => {
    targets.delete(el);
    el.style.removeProperty("clip-path");
    el.style.removeProperty("-webkit-clip-path");
    el.style.removeProperty("transition");
  };
}
