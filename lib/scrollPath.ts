export type PathKeyframe = {
  /** Scroll progress through the section (0 = entering, 1 = fully arrived). */
  t: number;
  /** X as fraction of section width (0 = left, 1 = right; >1 = off-screen right). */
  x: number;
  /** Y as fraction of section height (0 = top, 1 = bottom). */
  y: number;
};

function catmullRomScalar(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  u: number,
): number {
  const u2 = u * u;
  const u3 = u2 * u;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * u +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * u3)
  );
}

function sortedPath(path: PathKeyframe[]): PathKeyframe[] {
  return [...path].sort((a, b) => a.t - b.t);
}

/** Smooth position along keyframes for a given scroll progress. */
export function samplePathAtProgress(
  path: PathKeyframe[],
  progress: number,
): { x: number; y: number } {
  const sorted = sortedPath(path);
  if (sorted.length === 0) return { x: 0.5, y: 0.5 };
  if (sorted.length === 1) return { x: sorted[0].x, y: sorted[0].y };

  const p = Math.max(sorted[0].t, Math.min(sorted[sorted.length - 1].t, progress));
  if (p <= sorted[0].t) return { x: sorted[0].x, y: sorted[0].y };
  if (p >= sorted[sorted.length - 1].t) {
    const last = sorted[sorted.length - 1];
    return { x: last.x, y: last.y };
  }

  let segment = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (p >= sorted[i].t && p <= sorted[i + 1].t) {
      segment = i;
      break;
    }
  }

  const a = sorted[segment];
  const b = sorted[segment + 1];
  const localT = (p - a.t) / (b.t - a.t || 1);

  const pick = (index: number) => sorted[Math.max(0, Math.min(sorted.length - 1, index))];

  return {
    x: catmullRomScalar(
      pick(segment - 1).x,
      pick(segment).x,
      pick(segment + 1).x,
      pick(segment + 2).x,
      localT,
    ),
    y: catmullRomScalar(
      pick(segment - 1).y,
      pick(segment).y,
      pick(segment + 1).y,
      pick(segment + 2).y,
      localT,
    ),
  };
}

/** Straight-line segments between keyframes (A→B, then B→C). */
export function samplePathAtProgressLinear(
  path: PathKeyframe[],
  progress: number,
): { x: number; y: number } {
  const sorted = sortedPath(path);
  if (sorted.length === 0) return { x: 0.5, y: 0.5 };
  if (sorted.length === 1) return { x: sorted[0].x, y: sorted[0].y };

  const p = Math.max(sorted[0].t, Math.min(sorted[sorted.length - 1].t, progress));
  if (p <= sorted[0].t) return { x: sorted[0].x, y: sorted[0].y };
  if (p >= sorted[sorted.length - 1].t) {
    const last = sorted[sorted.length - 1];
    return { x: last.x, y: last.y };
  }

  let segment = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (p >= sorted[i].t && p <= sorted[i + 1].t) {
      segment = i;
      break;
    }
  }

  const a = sorted[segment];
  const b = sorted[segment + 1];
  const localT = (p - a.t) / (b.t - a.t || 1);

  return {
    x: a.x + (b.x - a.x) * localT,
    y: a.y + (b.y - a.y) * localT,
  };
}

/** Build an SVG path `d` by sampling the curve from tStart to tEnd. */
export function buildSmoothPathD(
  path: PathKeyframe[],
  width: number,
  height: number,
  tStart = 0,
  tEnd = 1,
  steps = 72,
  linear = false,
): string {
  const sorted = sortedPath(path);
  if (sorted.length < 2 || width <= 0 || height <= 0) return "";

  const start = Math.max(sorted[0].t, tStart);
  const end = Math.min(sorted[sorted.length - 1].t, tEnd);
  if (end <= start) return "";

  const sample = linear ? samplePathAtProgressLinear : samplePathAtProgress;
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = start + (i / steps) * (end - start);
    const { x, y } = sample(sorted, t);
    const px = x * width;
    const py = y * height;
    parts.push(`${i === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`);
  }
  return parts.join(" ");
}

export function buildPathExportCode(
  exportName: string,
  path: PathKeyframe[],
): string {
  const sorted = sortedPath(path);
  const lines = sorted.map((kf, i) => {
    const comment =
      i === 0
        ? " // scroll start"
        : i === sorted.length - 1
          ? " // scroll end / rest"
          : "";
    return `  { t: ${kf.t.toFixed(3)}, x: ${kf.x.toFixed(4)}, y: ${kf.y.toFixed(4)} },${comment}`;
  });
  return `export const ${exportName}: PathKeyframe[] = [\n${lines.join("\n")}\n];`;
}

/** Section scroll progress: 0 when entering, 1 when snapped in view. */
export function getSectionScrollProgress(section: HTMLElement): number {
  const rect = section.getBoundingClientRect();
  const vh = window.innerHeight;
  return Math.min(Math.max(1 - rect.top / vh, 0), 1);
}

/**
 * Two-phase progress for A→B (enter) then B→C (exit).
 * 0 = section entering, 0.5 = section fully in view, 1 = section leaving upward.
 */
export function getSectionEnterExitProgress(section: HTMLElement): number {
  const rect = section.getBoundingClientRect();
  const vh = window.innerHeight;

  if (rect.top >= vh) return 0;
  if (rect.bottom <= 0) return 1;

  if (rect.top >= 0) {
    return Math.min((1 - rect.top / vh) * 0.5, 0.5);
  }

  return Math.min(0.5 + (-rect.top / vh) * 0.5, 1);
}
