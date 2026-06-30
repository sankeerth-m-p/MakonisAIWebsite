"use client";

import { useEffect, useRef, useState } from "react";

const STAR_COLORS = ["#ffffff", "#ffffff", "#cfe0ff", "#fff3cf", "#ffd9d9"];
// 600 stars = 600 independently-animating composited DOM layers, which is a
// major GPU cost. 220 reads as just as dense at viewing distance.
const STAR_COUNT = 220;

type Star = {
  id: number;
  size: number;
  left: number;
  top: number;
  color: string;
  duration: number;
  delay: number;
  glow?: string;
};

function starCountForHeight(heightPercent: number) {
  if (heightPercent >= 100) return STAR_COUNT;
  return Math.max(80, Math.round(STAR_COUNT * (heightPercent / 100)));
}

function generateStars(count: number): Star[] {
  return Array.from({ length: count }, (_, i) => {
    const isLarge = Math.random() < 0.12;
    const size = isLarge ? 2.5 + Math.random() * 2.5 : 0.6 + Math.random() * 1.8;
    return {
      id: i,
      size,
      left: Math.random() * 100,
      top: Math.random() * 100,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]!,
      duration: 1.5 + Math.random() * 4,
      delay: Math.random() * 5,
      glow:
        size > 3
          ? `0 0 ${size * 2}px ${size / 2}px rgba(255,255,255,0.6)`
          : undefined,
    };
  });
}

export default function NightSkyStarsOverlay({
  className = "",
  heightPercent = 100,
  position = "top",
}: {
  className?: string;
  /** Star field height as % of parent. Values below 100 fade at the inner edge. */
  heightPercent?: number;
  /** Anchor band to top or bottom of parent. */
  position?: "top" | "bottom";
}) {
  const shootersRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState<Star[]>([]);
  const isFullHeight = heightPercent >= 100;
  const fadeGradient =
    position === "bottom"
      ? "linear-gradient(to top, #000 0%, #000 30%, transparent 100%)"
      : "linear-gradient(to bottom, #000 0%, #000 30%, transparent 100%)";

  useEffect(() => {
    setStars(generateStars(starCountForHeight(heightPercent)));
  }, [heightPercent]);

  useEffect(() => {
    const box = shootersRef.current;
    if (!box) return;

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    function launch() {
      if (cancelled || !box) return;

      const w = box.clientWidth || 680;
      const h = box.clientHeight || window.innerHeight;
      const angle = 5 + Math.random() * 18;
      const startX = -60 + Math.random() * (w * 0.45);
      const startY = 10 + Math.random() * (h * 0.8);
      const travel = 360 + Math.random() * 280;
      const len = 110 + Math.random() * 120;

      const anchor = document.createElement("div");
      anchor.className = "night-sky-meteor-anchor";
      anchor.style.left = `${startX}px`;
      anchor.style.top = `${startY}px`;
      anchor.style.transform = `rotate(${angle}deg)`;

      const streak = document.createElement("div");
      streak.className = "night-sky-meteor-streak";
      streak.style.width = `${len}px`;

      const head = document.createElement("div");
      head.className = "night-sky-meteor-head";
      streak.appendChild(head);
      anchor.appendChild(streak);
      box.appendChild(anchor);

      const dur = 900 + Math.random() * 600;
      streak.animate(
        [
          { transform: `translateX(-${len}px)`, opacity: 0 },
          { opacity: 1, offset: 0.15 },
          { opacity: 1, offset: 0.8 },
          { transform: `translateX(${travel}px)`, opacity: 0 },
        ],
        { duration: dur, easing: "cubic-bezier(0.25,0.6,0.35,1)" },
      );

      setTimeout(() => anchor.remove(), dur + 100);
    }

    function loop() {
      if (cancelled) return;
      launch();
      timeoutId = setTimeout(loop, 12000 + Math.random() * 18000);
    }

    const initialId = setTimeout(loop, 5000 + Math.random() * 8000);

    return () => {
      cancelled = true;
      clearTimeout(initialId);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      className={`pointer-events-none absolute z-0 overflow-hidden ${
        isFullHeight
          ? "inset-0"
          : position === "bottom"
            ? "inset-x-0 bottom-0"
            : "inset-x-0 top-0"
      } ${className}`}
      style={
        isFullHeight
          ? undefined
          : {
              height: `${heightPercent}%`,
              maskImage: fadeGradient,
              WebkitMaskImage: fadeGradient,
            }
      }
      aria-hidden
    >
      <div className="absolute inset-0">
        {stars.map((s) => (
          <div
            key={s.id}
            className="night-sky-star"
            style={{
              width: s.size,
              height: s.size,
              left: `${s.left}%`,
              top: `${s.top}%`,
              background: s.color,
              animation: `night-sky-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
              boxShadow: s.glow,
            }}
          />
        ))}
      </div>
      <div ref={shootersRef} className="absolute inset-0" />
    </div>
  );
}
