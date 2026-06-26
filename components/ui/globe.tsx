"use client";

import { useEffect, useRef } from "react";

type GlobeCometArcsProps = {
  size?: number;
  className?: string;
};

export default function GlobeCometArcs({
  size = 414,
  className = "",
}: GlobeCometArcsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const g = cv.getContext("2d")!;

    const W = 760, H = 870, cx = W * 0.46, cy = H * 0.45, R = 308, tilt = -0.40;

    const rotY = (p: {x:number,y:number,z:number}, a: number) => {
      const c = Math.cos(a), s = Math.sin(a);
      return { x: p.x * c - p.z * s, y: p.y, z: p.x * s + p.z * c };
    };
    const rotX = (p: {x:number,y:number,z:number}, a: number) => {
      const c = Math.cos(a), s = Math.sin(a);
      return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
    };
    const sph = (phi: number, lam: number) => ({
      x: Math.sin(phi) * Math.cos(lam),
      y: Math.cos(phi),
      z: Math.sin(phi) * Math.sin(lam),
    });
    const proj = (p: {x:number,y:number,z:number}) => {
      const per = 2.7, f = per / (per - p.z);
      return { x: cx + p.x * R * f, y: cy + p.y * R * f, d: (p.z + 1) / 2 };
    };

    const RINGS = 22, M = 80;
    const rings = Array.from({ length: RINGS }, (_, ri) => {
      const tt = ri / (RINGS - 1);
      return {
        phi:   0.11 * Math.PI + tt * 0.83 * Math.PI,
        phase: Math.random() * Math.PI * 2,
        span:  5.55 + Math.random() * 0.45,
        speed: 0.004 + Math.random() * 0.006,
        dir:   Math.random() < 0.5 ? 1 : -1,
        size:  4.5 + Math.random() * 5,
      };
    });

    let t = 0;
    let rafId = 0;

    const frame = () => {
      t += 1;
      const spin = t * 0.0009;
      g.clearRect(0, 0, W, H);

      for (const rg2 of rings) {
        const head = rg2.phase + rg2.dir * t * rg2.speed;
        const pts = Array.from({ length: M + 1 }, (_, m) => {
          const lam = head - rg2.dir * (m / M) * rg2.span;
          return proj(rotX(rotY(sph(rg2.phi, lam), spin), tilt));
        });

        for (let m = 0; m < M; m++) {
          const f    = 1 - m / M;
          const fade = Math.min(1, f * 3.2);
          const a    = pts[m], b = pts[m + 1];
          const dep  = (a.d + b.d) / 2;
          g.beginPath();
          g.moveTo(a.x, a.y);
          g.lineTo(b.x, b.y);
          g.strokeStyle = `rgba(244,249,255,${0.6 * fade * (0.35 + 0.65 * dep)})`;
          g.lineWidth   = 2.2 + 4.2 * f;
          g.stroke();
        }

        const hp = pts[0];
        g.shadowColor = "rgba(205,228,255,0.95)";
        g.shadowBlur  = 8 * hp.d + 3;
        g.beginPath();
        g.arc(hp.x, hp.y, rg2.size * (0.6 + 0.6 * hp.d), 0, Math.PI * 2);
        g.fillStyle = `rgba(255,255,255,${0.55 + 0.45 * hp.d})`;
        g.fill();
        g.shadowBlur = 0;
      }

      rafId = requestAnimationFrame(frame);
    };

    frame();
    return () => cancelAnimationFrame(rafId);
  }, []);

  const height = size * (870 / 760);

  return (
    <div className={className} style={{ width: size, height }}>
      <canvas
        ref={canvasRef}
        width={760}
        height={870}
        className="h-full w-full"
      />
    </div>
  );
}
