"use client";

import { useEffect, useRef } from "react";

export default function DesertBackground() {
  const skyRef = useRef<HTMLCanvasElement>(null);
  const hillsRef = useRef<HTMLCanvasElement>(null);
  const dunesRef = useRef<HTMLCanvasElement>(null);
  const dustRef = useRef<HTMLCanvasElement>(null);
  const plantsRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvases = [
      skyRef.current,
      hillsRef.current,
      dunesRef.current,
      dustRef.current,
      plantsRef.current,
    ];

    let W = 0, H = 0;

    function resize() {
      const el = skyRef.current?.parentElement;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvases.forEach((cv) => {
        if (!cv) return;
        cv.width = Math.round(W * devicePixelRatio);
        cv.height = Math.round(H * devicePixelRatio);
        const ctx = cv.getContext("2d");
        ctx?.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      });
    }

    resize();
    window.addEventListener("resize", resize);

    // ── helpers ──────────────────────────────────────────────
    function getCtx(ref: React.RefObject<HTMLCanvasElement | null>) {
      return ref.current?.getContext("2d") ?? null;
    }

    function wavePath(
      ctx: CanvasRenderingContext2D,
      baseY: number,
      amp: number,
      freq: number,
      phase: number
    ) {
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 3) {
        const y =
          baseY +
          Math.sin(x * freq + phase) * amp +
          Math.sin(x * freq * 1.7 + phase * 1.3) * amp * 0.3;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
    }

    function hillPath(
      ctx: CanvasRenderingContext2D,
      pts: [number, number][]
    ) {
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(pts[0][0], pts[0][1]);
      for (let i = 0; i < pts.length - 1; i++) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[i + 1];
        ctx.bezierCurveTo(
          x1 + (x2 - x1) * 0.5, y1,
          x2 - (x2 - x1) * 0.5, y2,
          x2, y2
        );
      }
      ctx.lineTo(W, H);
      ctx.closePath();
    }

    // ── layer draws ──────────────────────────────────────────
    function drawSky() {
      const ctx = getCtx(skyRef);
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#c8855a");
      g.addColorStop(0.55, "#d9986a");
      g.addColorStop(1, "#c07040");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    function drawHills() {
      const ctx = getCtx(hillsRef);
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      // far hills — very low, subtle
      hillPath(ctx, [
        [0, H * 0.72], [W * 0.15, H * 0.68], [W * 0.3, H * 0.70],
        [W * 0.5, H * 0.67], [W * 0.7, H * 0.70], [W * 0.85, H * 0.68], [W, H * 0.72],
      ]);
      ctx.fillStyle = "rgba(155,85,40,0.4)";
      ctx.fill();

      // near hills
      hillPath(ctx, [
        [0, H * 0.76], [W * 0.12, H * 0.72], [W * 0.28, H * 0.74],
        [W * 0.48, H * 0.71], [W * 0.65, H * 0.74], [W * 0.82, H * 0.72], [W, H * 0.76],
      ]);
      ctx.fillStyle = "rgba(135,70,30,0.55)";
      ctx.fill();
    }

    function drawDunes(t: number) {
      const ctx = getCtx(dunesRef);
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      const sp = 0.00035;

      const layers: [number, number, number, number, string][] = [
        [H * 0.72, 6, 0.006, t * sp,        "rgba(150,78,28,0.85)"],
        [H * 0.82, 7, 0.007, t * sp + 1.5,  "rgba(130,62,18,0.90)"],
        [H * 0.91, 6, 0.006, t * sp + 3,    "rgba(110,52,12,0.95)"],
      ];

      layers.forEach(([baseY, amp, freq, phase, color]) => {
        wavePath(ctx, baseY, amp, freq, phase);
        ctx.fillStyle = color;
        ctx.fill();
      });
    }

    function drawDust() {
      const ctx = getCtx(dustRef);
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      const dg = ctx.createLinearGradient(0, H * 0.78, 0, H);
      dg.addColorStop(0, "rgba(150,80,30,0)");
      dg.addColorStop(1, "rgba(120,60,20,0.65)");
      ctx.fillStyle = dg;
      ctx.fillRect(0, H * 0.78, W, H * 0.22);
    }

    function drawSketchCactus(
      ctx: CanvasRenderingContext2D,
      x: number, y: number, sc: number, alpha: number
    ) {
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "#7a4a1a";
      ctx.lineCap = "round";

      const pads: { x: number; y: number; rx: number; ry: number; a: number }[] = [
        { x: 0,   y: 0,   rx: 22, ry: 28, a: 0    },
        { x: -28, y: -20, rx: 18, ry: 22, a: -0.3 },
        { x: 25,  y: -18, rx: 17, ry: 21, a: 0.3  },
        { x: -18, y: -44, rx: 14, ry: 18, a: -0.1 },
        { x: 16,  y: -42, rx: 13, ry: 17, a: 0.2  },
        { x: 0,   y: -62, rx: 12, ry: 16, a: 0    },
      ];

      pads.forEach((p) => {
        ctx.save();
        ctx.translate(p.x * sc, p.y * sc);
        ctx.rotate(p.a);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.rx * sc, p.ry * sc, 0, 0, Math.PI * 2);
        ctx.lineWidth = 1.2 * sc;
        ctx.stroke();
        for (let s = 0; s < 6; s++) {
          const sa = (s / 6) * Math.PI * 2;
          const sx = Math.cos(sa) * p.rx * sc * 0.75;
          const sy = Math.sin(sa) * p.ry * sc * 0.75;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + Math.cos(sa) * 5 * sc, sy + Math.sin(sa) * 5 * sc);
          ctx.lineWidth = 0.8 * sc;
          ctx.stroke();
        }
        ctx.restore();
      });
      ctx.restore();
    }

    function drawTumbleweed(
      ctx: CanvasRenderingContext2D,
      x: number, y: number, r: number,
      alpha: number, t: number, speed: number
    ) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * speed);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "#7a4a1a";
      ctx.lineWidth = 0.9;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const ex = Math.cos(a) * r;
        const ey = Math.sin(a) * r;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(
          ex * 0.3 + ey * 0.2, ey * 0.3 - ex * 0.2,
          ex * 0.7 - ey * 0.15, ey * 0.7 + ex * 0.15,
          ex, ey
        );
        ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    function drawPlants(t: number) {
      const ctx = getCtx(plantsRef);
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      drawSketchCactus(ctx, W * 0.54, H * 0.88, 0.85, 0.5);
      drawSketchCactus(ctx, W * 0.46, H * 0.92, 0.60, 0.38);
      drawTumbleweed(ctx, W * 0.87, H * 0.70, 26, 0.42, t, 0.0008);
      drawTumbleweed(ctx, W * 0.36, H * 0.78, 16, 0.28, t, 0.0012);
    }

    // ── static layers (no animation) ────────────────────────
    drawSky();
    drawHills();
    drawDust();

    // ── animation loop (only animated layers) ───────────────
    function loop(t: number) {
      drawDunes(t);
      drawPlants(t);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const canvasStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* z-index 0 — sky gradient */}
      <canvas ref={skyRef}  style={{ ...canvasStyle, zIndex: 0 }} />
      {/* z-index 1 — low rolling hills */}
      <canvas ref={hillsRef} style={{ ...canvasStyle, zIndex: 1 }} />
      {/* z-index 2 — animated dune bands */}
      <canvas ref={dunesRef} style={{ ...canvasStyle, zIndex: 2 }} />
      {/* z-index 3 — dust haze at bottom */}
      <canvas ref={dustRef}  style={{ ...canvasStyle, zIndex: 3 }} />
      {/* z-index 4 — sketch plants & tumbleweeds */}
      <canvas ref={plantsRef} style={{ ...canvasStyle, zIndex: 4 }} />
      {/* z-index 5+ — slot your page content here */}
    </div>
  );
}