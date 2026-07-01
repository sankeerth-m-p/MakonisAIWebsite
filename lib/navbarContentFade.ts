/** Matches Navbar `h-20` (5rem). */
export const NAVBAR_FADE_HEIGHT_PX = 80;

/** Distance below the navbar where content eases back to full opacity. */
export const NAVBAR_FADE_ZONE_PX = 40;

/** Parallax groups inside containers move visually; fade them too. */
const CONTENT_SELECTOR =
  "main .makonis-container, main .makonis-container .will-change-transform";

function buildFadeMask(rect: DOMRect): string | null {
  const fadeEndViewport = NAVBAR_FADE_HEIGHT_PX + NAVBAR_FADE_ZONE_PX;

  if (rect.bottom <= NAVBAR_FADE_HEIGHT_PX) {
    return "linear-gradient(to bottom, transparent 0px, transparent 100%)";
  }

  if (rect.top >= fadeEndViewport) {
    return null;
  }

  const fadeStartInEl = Math.max(0, NAVBAR_FADE_HEIGHT_PX - rect.top);
  const fadeEndInEl = Math.min(rect.height, fadeEndViewport - rect.top);

  if (fadeEndInEl <= fadeStartInEl) {
    return null;
  }

  return `linear-gradient(to bottom, transparent ${fadeStartInEl}px, black ${fadeEndInEl}px)`;
}

export function applyNavbarContentFade(el: HTMLElement) {
  const mask = buildFadeMask(el.getBoundingClientRect());

  if (!mask) {
    el.style.removeProperty("mask-image");
    el.style.removeProperty("-webkit-mask-image");
    el.style.removeProperty("mask-size");
    el.style.removeProperty("-webkit-mask-size");
    el.style.removeProperty("mask-repeat");
    el.style.removeProperty("-webkit-mask-repeat");
    return;
  }

  el.style.maskImage = mask;
  el.style.webkitMaskImage = mask;
  el.style.maskSize = "100% 100%";
  el.style.webkitMaskSize = "100% 100%";
  el.style.maskRepeat = "no-repeat";
  el.style.webkitMaskRepeat = "no-repeat";
}

export function queryNavbarFadeTargets(root: ParentNode = document) {
  return Array.from(root.querySelectorAll<HTMLElement>(CONTENT_SELECTOR));
}

export function updateAllNavbarContentFades(root: ParentNode = document) {
  for (const el of queryNavbarFadeTargets(root)) {
    applyNavbarContentFade(el);
  }
}
