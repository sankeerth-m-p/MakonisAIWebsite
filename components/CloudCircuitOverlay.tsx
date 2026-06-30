"use client";

import ParallaxFloatGroup from "@/components/ui/ParallaxFloatGroup";
import React, { useEffect, useRef, useState } from "react";

/**
 * CloudCircuitOverlay
 * ---------------------------------------------------------------------------
 * Animated cloud-computing overlay: transparent glowing cloud outlines with an
 * octilinear circuit field beneath them. The circuit never overlaps the clouds
 * (the cloud shapes are carved out of the field) and is weighted to sit below
 * them.
 *
 * It renders an absolutely/fixed-positioned canvas that fills its container and
 * is click-through (pointer-events: none) by default, so you can drop it on top
 * of any content.
 *
 * NOTE: the glow uses additive ("lighter") blending + radial gradients, so it
 * reads best over a DARK surface. Use `backdrop` to paint the dark gradient
 * behind it if your host background is light.
 *
 * Usage:
 *   <div style={{ position: "relative" }}>
 *     <YourContent />
 *     <CloudCircuitOverlay />
 *   </div>
 */

export interface CloudCircuitOverlayProps {
  /** "fixed" covers the viewport, "absolute" covers the nearest positioned ancestor. */
  position?: "fixed" | "absolute";
  /** Stacking order of the overlay. */
  zIndex?: number;
  /** Overall opacity of the overlay. */
  opacity?: number;
  /** If true the overlay captures pointer events; default false (click-through). */
  interactive?: boolean;
  /** Paint the dark blue gradient behind the animation (useful over light hosts). */
  backdrop?: boolean;
  /** Render each cloud in its own parallax layer (circuit stays static). */
  separatedClouds?: boolean;
  /** Per-cloud parallax shift (px); defaults to staggered depths. */
  cloudParallaxShifts?: number[];
  /** Fade out the bottom edge over this fraction of overlay height (0–1). */
  bottomFade?: number;
  className?: string;
  style?: React.CSSProperties;
}

export interface CloudLayout {
  ox: number;
  oy: number;
  s: number;
  baseY: number;
  phase: number;
  speed: number;
  width: number;
  height: number;
}

type Pt = [number, number];
type Trace = Pt[];

interface GlowNode {
  x: number;
  y: number;
  r: number;
  glowMul: number;
  phase: number;
  speed: number;
  baseAlpha: number;
}

interface Pulse {
  trace: Trace;
  t: number;
  speed: number;
  delay: number;
  elapsed: number;
}

interface Dot {
  x: number;
  y: number;
  r: number;
  a: number;
  twinkle?: boolean;
  phase?: number;
}

interface Cloud {
  ox: number;
  oy: number;
  s: number;
  drawPath: Path2D;
  baseY: number;
  phase: number;
  speed: number;
}

const GRID = 34;
const CLOUD_PATH =
  "M 36 112 C 16 112 2 98 2 80 C 2 64 14 51 30 50 C 32 30 49 14 70 14 C 87 14 102 24 108 39 C 113 35 119 33 126 33 C 145 33 160 48 160 67 C 160 69 160 71 159 73 C 175 75 188 88 188 104 C 188 109 185 112 180 112 Z";
const CL_CX = 95;
const CL_CY = 59;
const INFLATE = 1.18;

// top-center, left-middle, right-lower
const CLOUD_DEF = [
  { fx: 0.5, fy: 0.2, rel: 1.0 },
  { fx: 0.21, fy: 0.45, rel: 1.06 },
  { fx: 0.76, fy: 0.56, rel: 1.0 },
];

// Cardinal vectors: 0=E, 1=S, 2=W, 3=N
const VEC: Pt[] = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const DEFAULT_CLOUD_PARALLAX_SHIFTS = [40, 60, 80];

function SeparatedCloudCanvas({
  phase,
  speed,
  scale,
  reduced,
}: {
  phase: number;
  speed: number;
  scale: number;
  reduced: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const path = new Path2D(CLOUD_PATH);
    const pad = 24;
    const w = Math.ceil(188 * scale + pad * 2);
    const h = Math.ceil(112 * scale + pad * 2);
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      const breathe = 0.82 + 0.18 * Math.sin(now * 0.001 * speed + phase);
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(pad, pad);
      ctx.scale(scale, scale);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(63,208,255,0.95)";
      ctx.shadowBlur = 14 + 6 * breathe;
      ctx.strokeStyle = `rgba(63,208,255,${0.55 * breathe})`;
      ctx.lineWidth = 3.0;
      ctx.stroke(path);
      ctx.shadowBlur = 5;
      ctx.strokeStyle = `rgba(190,242,255,${0.9 * breathe})`;
      ctx.lineWidth = 1.5;
      ctx.stroke(path);
      ctx.restore();
      if (!reduced) raf = requestAnimationFrame(draw);
    };

    resize();
    draw(0);
    if (!reduced) raf = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(raf);
  }, [phase, speed, scale, reduced]);

  const pad = 24;
  const w = Math.ceil(188 * scale + pad * 2);
  const h = Math.ceil(112 * scale + pad * 2);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width: w, height: h }}
    />
  );
}

export default function CloudCircuitOverlay({
  position = "fixed",
  zIndex = 0,
  opacity = 1,
  interactive = false,
  backdrop = false,
  separatedClouds = true,
  cloudParallaxShifts = DEFAULT_CLOUD_PARALLAX_SHIFTS,
  bottomFade = 0,
  className,
  style,
}: CloudCircuitOverlayProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cloudLayouts, setCloudLayouts] = useState<CloudLayout[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const CLOUD_LOCAL = new Path2D(CLOUD_PATH);

    let W = 0;
    let H = 0;
    let raf = 0;
    let lastTime = performance.now();

    let paths: Trace[] = [];
    let nodes: GlowNode[] = [];
    let pulses: Pulse[] = [];
    let dots: Dot[] = [];
    let clouds: Cloud[] = [];
    let exclusion: Path2D = new Path2D();

    // octilinear trace: cardinal runs joined by single 45deg chamfers
    function makeTrace(x0: number, y0: number, startDir?: number): Trace {
      let dir = startDir == null ? Math.floor(rand(0, 4)) : startDir;
      let x = x0;
      let y = y0;
      const pts: Trace = [[x, y]];
      const segCount = Math.floor(rand(3, 8));
      for (let i = 0; i < segCount; i++) {
        if (i > 0 && Math.random() < 0.45) {
          const turn = Math.random() < 0.5 ? 1 : -1;
          const nd = (dir + turn + 4) % 4;
          const dx = VEC[dir][0] + VEC[nd][0];
          const dy = VEC[dir][1] + VEC[nd][1];
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          x += (dx / len) * GRID;
          y += (dy / len) * GRID;
          pts.push([x, y]);
          dir = nd;
        }
        const steps = Math.floor(rand(1, 4));
        x += VEC[dir][0] * GRID * steps;
        y += VEC[dir][1] * GRID * steps;
        pts.push([x, y]);
        if (x < -GRID * 2 || x > W + GRID * 2 || y < -GRID * 2 || y > H + GRID * 2)
          break;
      }
      return pts;
    }

    function buildClouds() {
      clouds = [];
      const s0 = Math.max(0.42, Math.min(1.45, (0.22 * W) / 190));
      exclusion = new Path2D();
      exclusion.rect(0, 0, W, H); // outer; clouds become holes (evenodd)
      CLOUD_DEF.forEach((d) => {
        const s = s0 * d.rel;
        const ox = d.fx * W - CL_CX * s;
        const oy = d.fy * H - CL_CY * s;

        const mDraw = new DOMMatrix().translateSelf(ox, oy).scaleSelf(s, s);
        const drawPath = new Path2D();
        drawPath.addPath(CLOUD_LOCAL, mDraw);

        const mInf = new DOMMatrix()
          .translateSelf(ox, oy)
          .scaleSelf(s, s)
          .translateSelf(CL_CX, CL_CY)
          .scaleSelf(INFLATE, INFLATE)
          .translateSelf(-CL_CX, -CL_CY);
        exclusion.addPath(CLOUD_LOCAL, mInf);

        const baseY = oy + 112 * s;
        clouds.push({
          ox,
          oy,
          s,
          drawPath,
          baseY,
          phase: rand(0, Math.PI * 2),
          speed: rand(0.5, 1.0),
        });
      });

      if (separatedClouds) {
        const pad = 24;
        setCloudLayouts(
          clouds.map((c) => ({
            ox: c.ox - pad,
            oy: c.oy - pad,
            s: c.s,
            baseY: c.baseY,
            phase: c.phase,
            speed: c.speed,
            width: Math.ceil(188 * c.s + pad * 2),
            height: Math.ceil(112 * c.s + pad * 2),
          }))
        );
      }
    }

    function generate() {
      paths = [];
      nodes = [];
      pulses = [];
      dots = [];
      buildClouds();

      const cols = Math.ceil(W / GRID);
      const rows = Math.ceil(H / GRID);
      const traceCount = Math.floor((cols * rows) / 10);

      // circuit field, weighted to sit BELOW the clouds
      for (let i = 0; i < traceCount; i++) {
        const sx = Math.floor(rand(0, cols)) * GRID;
        const sy = Math.floor(rand(0, rows)) * GRID;
        const yf = sy / H;
        const keep = yf < 0.13 ? 0 : Math.min(1, (yf - 0.13) / 0.33);
        if (Math.random() > keep) continue;
        const pts = makeTrace(sx, sy);
        if (pts.length >= 2) paths.push(pts);
      }

      // traces dropping out of each cloud base into the field
      clouds.forEach((c) => {
        const n = Math.floor(rand(2, 4));
        for (let k = 0; k < n; k++) {
          const lx = 50 + Math.random() * 90;
          const x = c.ox + lx * c.s;
          const y = c.baseY + 16 * c.s;
          paths.push(makeTrace(x, y, 1));
        }
      });

      // glow nodes on a subset of endpoints
      paths.forEach((p) => {
        if (Math.random() < 0.5) {
          const end = pick([p[0], p[p.length - 1]]);
          const hero = Math.random() < 0.2;
          nodes.push({
            x: end[0],
            y: end[1],
            r: hero ? rand(3.2, 4.4) : rand(1.2, 2.2),
            glowMul: hero ? rand(7, 9) : rand(4, 6),
            phase: rand(0, Math.PI * 2),
            speed: rand(0.5, 1.1),
            baseAlpha: hero ? rand(0.85, 1) : rand(0.45, 0.8),
          });
        }
        p.forEach((pt, i) => {
          if (i > 0 && i < p.length - 1 && Math.random() < 0.1)
            dots.push({ x: pt[0], y: pt[1], r: rand(0.6, 1.1), a: rand(0.15, 0.35) });
        });
      });

      // ambient dust
      const ambient = Math.floor((W * H) / 4500);
      for (let i = 0; i < ambient; i++) {
        dots.push({
          x: rand(0, W),
          y: rand(0, H),
          r: rand(0.4, 1.1),
          a: rand(0.08, 0.3),
          twinkle: Math.random() < 0.35,
          phase: rand(0, Math.PI * 2),
        });
      }

      // traveling pulses
      const cand = paths.filter((p) => p.length >= 3);
      const pcount = Math.max(4, Math.floor(cand.length * 0.08));
      for (let i = 0; i < pcount; i++) {
        pulses.push({
          trace: pick(cand),
          t: rand(0, 1),
          speed: rand(0.04, 0.09),
          delay: rand(0, 7),
          elapsed: 0,
        });
      }
    }

    function strokePath(p: Trace, color: string, width: number) {
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    }

    function pointAtT(px: Trace, t: number): Pt {
      let total = 0;
      const seg: number[] = [];
      for (let i = 1; i < px.length; i++) {
        const dx = px[i][0] - px[i - 1][0];
        const dy = px[i][1] - px[i - 1][1];
        const l = Math.sqrt(dx * dx + dy * dy);
        seg.push(l);
        total += l;
      }
      if (total === 0) return px[0];
      const target = t * total;
      let acc = 0;
      for (let i = 0; i < seg.length; i++) {
        if (acc + seg[i] >= target) {
          const st = (target - acc) / seg[i];
          return [
            px[i][0] + (px[i + 1][0] - px[i][0]) * st,
            px[i][1] + (px[i + 1][1] - px[i][1]) * st,
          ];
        }
        acc += seg[i];
      }
      return px[px.length - 1];
    }

    function drawClouds(now: number) {
      if (!ctx) return;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      clouds.forEach((c) => {
        const breathe = 0.82 + 0.18 * Math.sin(now * 0.001 * c.speed + c.phase);
        ctx.shadowColor = "rgba(63,208,255,0.95)";
        ctx.shadowBlur = 14 + 6 * breathe;
        ctx.strokeStyle = `rgba(63,208,255,${0.55 * breathe})`;
        ctx.lineWidth = 3.0;
        ctx.stroke(c.drawPath);
        ctx.shadowBlur = 5;
        ctx.strokeStyle = `rgba(190,242,255,${0.9 * breathe})`;
        ctx.lineWidth = 1.5;
        ctx.stroke(c.drawPath);
      });
      ctx.restore();
    }

    function draw(now: number) {
      if (!ctx) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      ctx.clearRect(0, 0, W, H);

      // circuit, clipped to OUTSIDE the cloud shapes
      ctx.save();
      ctx.clip(exclusion, "evenodd");

      paths.forEach((p) => strokePath(p, "rgba(60,130,210,0.33)", 1));

      dots.forEach((d) => {
        let a = d.a;
        if (d.twinkle) a = d.a * (0.5 + 0.5 * Math.sin(now * 0.0011 + (d.phase ?? 0)));
        ctx.beginPath();
        ctx.fillStyle = `rgba(170,205,255,${a})`;
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalCompositeOperation = "lighter";

      nodes.forEach((n) => {
        const pulse = 0.65 + 0.35 * Math.sin(now * 0.001 * n.speed + n.phase);
        const alpha = n.baseAlpha * pulse;
        const radius = n.r * (0.92 + 0.18 * pulse);
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius * n.glowMul);
        g.addColorStop(0, `rgba(225,250,255,${0.85 * alpha})`);
        g.addColorStop(0.18, `rgba(110,190,255,${0.5 * alpha})`);
        g.addColorStop(0.5, `rgba(40,120,210,${0.16 * alpha})`);
        g.addColorStop(1, "rgba(20,60,120,0)");
        ctx.beginPath();
        ctx.fillStyle = g;
        ctx.arc(n.x, n.y, radius * n.glowMul, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${Math.min(1, alpha)})`;
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      pulses.forEach((p) => {
        p.elapsed += dt;
        if (p.elapsed < p.delay) return;
        p.t += p.speed * dt;
        if (p.t > 1) {
          p.t = 0;
          p.delay = rand(0.5, 5);
          p.elapsed = 0;
        }
        const [x, y] = pointAtT(p.trace, p.t);
        const fade = Math.sin(Math.PI * p.t);
        const g = ctx.createRadialGradient(x, y, 0, x, y, 14);
        g.addColorStop(0, `rgba(230,248,255,${0.9 * fade})`);
        g.addColorStop(0.3, `rgba(110,180,255,${0.45 * fade})`);
        g.addColorStop(1, "rgba(40,100,200,0)");
        ctx.beginPath();
        ctx.fillStyle = g;
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${fade})`;
        ctx.arc(x, y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalCompositeOperation = "source-over";
      ctx.restore();

      if (!separatedClouds) drawClouds(now);

      if (!reduced) raf = requestAnimationFrame(draw);
    }

    function resize() {
      if (!wrap || !canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = wrap.getBoundingClientRect();
      W = Math.max(1, Math.round(rect.width));
      H = Math.max(1, Math.round(rect.height));
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      generate();
      if (reduced) {
        ctx!.clearRect(0, 0, W, H);
        draw(0);
      }
    }

    const ro = new ResizeObserver(() => resize());
    ro.observe(wrap);
    resize();
    if (!reduced) raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [separatedClouds]);

  const bottomFadeMask =
    bottomFade > 0
      ? `linear-gradient(to bottom, #000 0%, #000 ${(1 - bottomFade) * 100}%, transparent 100%)`
      : undefined;

  return (
    <div
      ref={wrapRef}
      className={className}
      aria-hidden
      style={{
        position,
        inset: 0,
        zIndex,
        opacity,
        pointerEvents: interactive ? "auto" : "none",
        overflow: "hidden",
        background: backdrop
          ? "linear-gradient(135deg, #06295c 0%, #052055 18%, #03162f 55%, #020e22 100%)"
          : "transparent",
        ...(bottomFadeMask
          ? { maskImage: bottomFadeMask, WebkitMaskImage: bottomFadeMask }
          : {}),
        ...style,
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
      {separatedClouds &&
        cloudLayouts.map((layout, i) => (
          <ParallaxFloatGroup
            key={i}
            shift={cloudParallaxShifts[i] ?? cloudParallaxShifts[0] ?? 50}
            className="pointer-events-none absolute"
            style={{
              left: layout.ox,
              top: layout.oy,
              width: layout.width,
              height: layout.height,
              zIndex: 1,
            }}
          >
            <SeparatedCloudCanvas
              phase={layout.phase}
              speed={layout.speed}
              scale={layout.s}
              reduced={reducedMotion}
            />
          </ParallaxFloatGroup>
        ))}
    </div>
  );
}