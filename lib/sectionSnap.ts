import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Sections that participate in CSS scroll snap once the intro zone is reached. */
export const SNAP_SECTION_IDS = [
  "intro",
  "service-custom-ai",
  "service-generative-ai",
  "service-data-engineering",
  "service-model-ops",
  "process",
  "impact",
  "why-ai",
] as const;

/** Full-viewport snap stops — one section per gesture (scroll-snap-stop: always). */
export const SNAP_SECTION_CLASS = "snap-section min-h-screen pt-20";

/** Tall sections: snap at entry, free scroll through interior (e.g. Impact horizontal scrub). */
export const SNAP_SECTION_FLOW_CLASS =
  "snap-section snap-section--flow min-h-screen pt-20";

export function getSectionDocumentTop(element: HTMLElement): number {
  return element.getBoundingClientRect().top + window.scrollY;
}

export function getSectionSnapTop(element: HTMLElement): number {
  return Math.round(getSectionDocumentTop(element));
}

export function isHeroPinned(): boolean {
  const hero = document.getElementById("hero");
  if (!hero) return false;

  const heroTrigger = ScrollTrigger.getAll().find(
    (trigger) => trigger.trigger === hero,
  );
  return Boolean(heroTrigger?.isActive);
}

/** Impact needs free vertical scroll across its full sticky height. */
export function isImpactFreeScrollZone(scrollY = window.scrollY): boolean {
  const impact = document.getElementById("impact");
  if (!impact) return false;

  const sectionTop = getSectionDocumentTop(impact);
  const sectionBottom = sectionTop + impact.offsetHeight;
  const viewport = window.innerHeight;
  const exitY = sectionBottom - viewport;

  return scrollY > sectionTop + 12 && scrollY < exitY - 12;
}

export function isInSnapZone(scrollY = window.scrollY): boolean {
  const intro = document.getElementById("intro");
  if (!intro) return false;

  // Free scroll while approaching intro from the hero.
  if (scrollY < getSectionSnapTop(intro) - 60) {
    return false;
  }

  return true;
}

/** Toggles `html.snap-enabled` — native CSS mandatory snap on the document scroller. */
export function shouldEnableCssSnap(scrollY = window.scrollY): boolean {
  if (!isInSnapZone(scrollY)) return false;
  if (isHeroPinned()) return false;
  if (isImpactFreeScrollZone(scrollY)) return false;
  return true;
}

/** @deprecated use shouldEnableCssSnap */
export function shouldDisableSnap(scrollY = window.scrollY): boolean {
  return !shouldEnableCssSnap(scrollY);
}
