/**
 * Tiny shared channel so the glass-door hero can drive the reveal of elements
 * that live OUTSIDE the GlassDoorReveal component tree (e.g. the fixed Navbar).
 *
 * GlassDoorReveal publishes the live screen-X of the two door inner edges on
 * every ScrollTrigger update. Any element registered here gets clipped with the
 * exact same `inset()` mask the big bottom logo uses — so it reveals perfectly
 * in sync with the doors swinging open.
 */

let leftSeamX: number | null = null;
let rightSeamX: number | null = null;

type RevealTargetOptions = {
  /** CSS length for `inset(… round …)` so rounded UI keeps its shape while clipped. */
  round?: string;
};

const targets = new Map<HTMLElement, RevealTargetOptions>();

function applyMask(
  el: HTMLElement,
  leftInsetPercent: number,
  rightInsetPercent: number,
  round?: string,
) {
  const left = Math.max(0, Math.min(100, leftInsetPercent));
  const right = Math.max(0, Math.min(100, rightInsetPercent));

  // Doors fully open → drop the clip entirely so the element renders exactly as
  // designed (no clip box at all).
  if (left <= 0 && right <= 0) {
    el.style.clipPath = "none";
    el.style.setProperty("-webkit-clip-path", "none");
    return;
  }

  const roundPart = round ? ` round ${round}` : "";
  const clip = `inset(0% ${right}% 0% ${left}%${roundPart})`;
  el.style.clipPath = clip;
  el.style.setProperty("-webkit-clip-path", clip);
}

function syncTarget(el: HTMLElement, options: RevealTargetOptions = {}) {
  if (leftSeamX == null || rightSeamX == null) return;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0) return;
  const leftInset = ((leftSeamX - rect.left) / rect.width) * 100;
  const rightInset = ((rect.right - rightSeamX) / rect.width) * 100;
  applyMask(el, leftInset, rightInset, options.round);
}

/** GlassDoorReveal calls this on every update with the live door-edge positions. */
export function publishDoorEdges(left: number, right: number) {
  leftSeamX = left;
  rightSeamX = right;
  targets.forEach((options, el) => syncTarget(el, options));
}

/** Register an element to be revealed in sync with the doors. Returns an unregister fn. */
export function registerDoorRevealTarget(
  el: HTMLElement,
  options: RevealTargetOptions = {},
) {
  targets.set(el, options);
  // Apply immediately if we already have edge positions (e.g. mid-scroll mount).
  syncTarget(el, options);
  return () => {
    targets.delete(el);
  };
}
