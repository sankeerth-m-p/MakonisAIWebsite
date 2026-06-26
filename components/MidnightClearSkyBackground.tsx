"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import {
  MIDNIGHT_CLEAR_SKY,
  applyWeather,
  baseSky,
  daylight,
  skyGradientLinearFromStops,
} from "@/lib/weatherSky";

const MIDNIGHT_HOUR = 0;

type StarParticle = { x: number; y: number; r: number; tw: number; tws: number };

export default function MidnightClearSkyBackground({
  className = "",
}: {
  className?: string;
}) {
  const skyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const sky = skyRef.current;
    if (!canvas || !sky) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0;
    let H = 0;
    let raf = 0;
    let stars: StarParticle[] = [];
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    const buildStars = () => {
      stars = [];
      for (let i = 0; i < 125; i++) {
        stars.push({
          x: rnd(0, W),
          y: rnd(0, H * 0.85),
          r: rnd(0.35, 1.3),
          tw: rnd(0, 6.28),
          tws: rnd(0.015, 0.045),
        });
      }
    };

    const resize = () => {
      const parent = canvas.parentElement;
      W = parent?.clientWidth ?? innerWidth;
      H = parent?.clientHeight ?? innerHeight;
      canvas.width = W;
      canvas.height = H;
      buildStars();
    };

    const drawStars = () => {
      const starFade = Math.max(0, 1 - daylight(MIDNIGHT_HOUR) * 1.6);
      if (starFade <= 0.02) return;

      for (const p of stars) {
        if (!reduce) p.tw += p.tws;
        ctx.globalAlpha = starFade;
        ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.abs(Math.sin(p.tw)) * 0.45})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.28);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const stops = applyWeather(baseSky(MIDNIGHT_HOUR), "clear");
      sky.style.background = skyGradientLinearFromStops(stops);
      ctx.clearRect(0, 0, W, H);
      drawStars();
    };

    resize();
    addEventListener("resize", resize);
    loop();
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}>
      <div
        ref={skyRef}
        className="absolute inset-0"
        style={{ background: MIDNIGHT_CLEAR_SKY }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <Image
        src="/moon.png"
        alt=""
        width={512}
        height={512}
        aria-hidden
        className="absolute top-[3vh] left-[3vh] h-[50vh] w-[50vh] object-contain select-none"
      />
    </div>
  );
}
