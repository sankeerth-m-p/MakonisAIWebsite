const NS = "http://www.w3.org/2000/svg";

const TRACK = 14;
const RADIUS = 6;
const STROKE = 1.5;
const MARGIN = 16;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const randi = (a: number, b: number) => Math.floor(rand(a, b + 1));
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const dist = (p: number[], q: number[]) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const unit = (f: number[], t: number[]) => {
  const dx = t[0] - f[0];
  const dy = t[1] - f[1];
  const l = Math.hypot(dx, dy) || 1;
  return [dx / l, dy / l];
};

function roundedPath(pts: number[][], r: number) {
  if (pts.length < 3) {
    return `M ${pts[0][0]} ${pts[0][1]} L ${pts.at(-1)![0]} ${pts.at(-1)![1]}`;
  }
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const rr = Math.min(r, dist(p0, p1) / 2, dist(p1, p2) / 2);
    const v1 = unit(p1, p0);
    const v2 = unit(p1, p2);
    const a = [p1[0] + v1[0] * rr, p1[1] + v1[1] * rr];
    const b = [p1[0] + v2[0] * rr, p1[1] + v2[1] * rr];
    d += ` L ${a[0]} ${a[1]} Q ${p1[0]} ${p1[1]} ${b[0]} ${b[1]}`;
  }
  const last = pts.at(-1)!;
  return `${d} L ${last[0]} ${last[1]}`;
}

const make = (tag: string, attrs: Record<string, string>) => {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
};

export type BoatWaveFieldOptions = {
  /** Scales trace amplitude, spacing, and stroke for smaller wakes. */
  scale?: number;
};

/** Populate an SVG with horizontally scrolling wave trace lines. */
export function generateBoatWaveField(
  svg: SVGSVGElement,
  options: BoatWaveFieldOptions = {},
) {
  const fieldScale = Math.max(0.35, Math.min(1, options.scale ?? 1));
  const track = TRACK * fieldScale;
  const radius = RADIUS * fieldScale;
  const stroke = STROKE * fieldScale;
  const margin = MARGIN * fieldScale;

  const r = svg.getBoundingClientRect();
  const W = Math.max(320, r.width);
  const H = Math.max(180, r.height);
  const TILE = W;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("overflow", "visible");
  svg.style.overflow = "visible";
  svg.innerHTML = "";

  const defs = make("defs", {});
  const filter = make("filter", {
    id: "boat-wave-neon",
    x: "-50%",
    y: "-50%",
    width: "200%",
    height: "200%",
    "color-interpolation-filters": "sRGB",
  });
  filter.appendChild(
    make("feGaussianBlur", { in: "SourceGraphic", stdDeviation: "1.4", result: "blur" }),
  );
  filter.appendChild(
    make("feFlood", { "flood-color": "#4de8ff", "flood-opacity": "0.92", result: "color" }),
  );
  filter.appendChild(
    make("feComposite", { in: "color", in2: "blur", operator: "in", result: "glow" }),
  );
  filter.appendChild(
    make("feGaussianBlur", { in: "glow", stdDeviation: "3.2", result: "glowWide" }),
  );
  const merge = make("feMerge", {});
  merge.appendChild(make("feMergeNode", { in: "glowWide" }));
  merge.appendChild(make("feMergeNode", { in: "glow" }));
  merge.appendChild(make("feMergeNode", { in: "SourceGraphic" }));
  filter.appendChild(merge);
  defs.appendChild(filter);
  svg.appendChild(defs);

  let delay = 0;

  const buildScaledTrace = (startY: number) => {
    const AMP = track * 3;
    const lo = Math.max(margin, startY - AMP);
    const hi = Math.min(H - margin, startY + AMP);
    const endZone = TILE - 90;
    const pts: number[][] = [[0, startY]];
    let x = rand(20, 55);
    let y = startY;
    pts.push([x, y]);
    while (x < endZone) {
      x = Math.min(endZone, x + rand(40, 110));
      pts.push([x, y]);
      if (Math.random() < 0.66 && x < endZone) {
        const dir = y <= lo ? 1 : y >= hi ? -1 : Math.random() < 0.5 ? 1 : -1;
        const ny = clamp(y + dir * track * randi(1, 2), lo, hi);
        x = Math.min(endZone, x + Math.abs(ny - y));
        y = ny;
        pts.push([x, y]);
      }
    }
    if (y !== startY) {
      x += Math.abs(startY - y);
      pts.push([x, startY]);
    }
    pts.push([TILE, startY]);
    return pts;
  };

  const addTrace = (pts: number[][], parent: SVGGElement) => {
    const op = rand(0.38, 0.72);
    const path = make("path", {
      d: roundedPath(pts, radius),
      fill: "none",
      "stroke-width": String(stroke),
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      filter: "url(#boat-wave-neon)",
    });
    path.style.stroke = `rgba(var(--trace), ${op})`;
    path.style.animationDelay = `${(delay += 24)}ms`;
    parent.appendChild(path);
  };

  const root = make("g", {});

  const addFlow = (pts: number[][]) => {
    const line = make("g", {}) as SVGGElement;
    addTrace(pts, line);
    const clone = line.cloneNode(true) as SVGGElement;
    clone.setAttribute("transform", `translate(${TILE},0)`);
    const flow = make("g", { class: "boat-wave-flow" }) as SVGGElement;
    flow.appendChild(line);
    flow.appendChild(clone);
    const speed = rand(16, 58) * fieldScale;
    const dur = TILE / speed;
    flow.style.setProperty("--tile", String(TILE));
    flow.style.setProperty("--dur", `${dur.toFixed(2)}s`);
    flow.style.setProperty("--delay", `${(-rand(0, dur)).toFixed(2)}s`);
    root.appendChild(flow);
  };

  for (let y = margin + track; y < H - margin; y += track) {
    addFlow(buildScaledTrace(y + rand(-5, 5) * fieldScale));
  }
  if (fieldScale >= 0.75) {
    for (let y = margin + track * 1.5; y < H - margin; y += track) {
      if (Math.random() < 0.7) addFlow(buildScaledTrace(y + rand(-4, 4) * fieldScale));
    }
  }

  svg.appendChild(root);
}
