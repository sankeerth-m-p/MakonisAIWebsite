"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src?: string;
  scrollHeightVh?: number;
  scrollStart?: number;
  scrollEnd?: number;
  /** Clip inset % at scroll start (progress 0). Default 30 — video already partly visible. */
  maskStartInset?: number;
  /** Clip inset % at scroll end (progress 1). Default 0 — fully revealed. */
  maskEndInset?: number;
  /** Scroll progress (0–1) at which video starts auto-playing. */
  playAtProgress?: number;
  /** Initial mask width as a fraction of available viewport width (0–1). */
  maskStartWidth?: number;
  /** Corner radius in px (rounded-lg = 8). */
  maskCornerRadius?: number;
  /** Scroll follow smoothness (0–1). Lower = smoother, slower catch-up. */
  smoothness?: number;
  /** Final mask size relative to viewport (1.05 = 105%). */
  maskEndScale?: number;
};



export default function VideoScrollScrub({
  src = "/makonis.ai_video.mp4",
  scrollHeightVh = 400,
  scrollStart = 0.1,
  scrollEnd = 0.9,
  maskStartInset = 30,
  maskEndInset = 0,
  playAtProgress = 0.1,
  maskStartWidth = 0.85,
  maskCornerRadius = 8,
  smoothness = 0.06,
  maskEndScale = 1.05,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetProgressRef = useRef(0);
  const smoothProgressRef = useRef(0);
  const smoothRafRef = useRef(0);

  const [smoothProgress, setSmoothProgress] = useState(0);
  const [barProg, setBarProg] = useState(0);
  const [ready, setReady] = useState(false);
  const [loadPct, setLoadPct] = useState(0);
  const isPlayingRef = useRef(false);
  const progRafRef = useRef(0);
  const progStartRef = useRef<number | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const updateViewport = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

  useEffect(() => {
    const tick = () => {
      const target = targetProgressRef.current;
      let smooth = smoothProgressRef.current;
      smooth += (target - smooth) * smoothness;
      if (Math.abs(target - smooth) < 0.0003) smooth = target;
      smoothProgressRef.current = smooth;
      setSmoothProgress(smooth);
      smoothRafRef.current = requestAnimationFrame(tick);
    };
    smoothRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(smoothRafRef.current);
  }, [smoothness]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const stopBarProg = () => {
      cancelAnimationFrame(progRafRef.current);
      progStartRef.current = null;
      setBarProg(0);
    };

    const startBarProg = () => {
      cancelAnimationFrame(progRafRef.current);
      progStartRef.current = Date.now();
      const tick = () => {
        if (!progStartRef.current) return;
        const t = Math.min((Date.now() - progStartRef.current) / 3000, 1);
        setBarProg(t * 100);
        if (t < 1) {
          progRafRef.current = requestAnimationFrame(tick);
        } else {
          progStartRef.current = Date.now();
          progRafRef.current = requestAnimationFrame(tick);
        }
      };
      progRafRef.current = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const rect = container.getBoundingClientRect();
      const scrollable = container.offsetHeight - window.innerHeight;
      if (scrollable <= 0) {
        targetProgressRef.current = 0;
        return;
      }
      const scrolled = -rect.top;
      const start = scrollable * scrollStart;
      const end = scrollable * scrollEnd;
      const raw = (scrolled - start) / (end - start);
      const p = Math.max(0, Math.min(1, raw));
      targetProgressRef.current = p;

      if (p > 0.95 && !isPlayingRef.current) {
        isPlayingRef.current = true;
        startBarProg();
      } else if (p < playAtProgress && isPlayingRef.current) {
        isPlayingRef.current = false;
        stopBarProg();
      }

      const video = videoRef.current;
      if (video && ready) {
        if (p >= playAtProgress) {
          if (video.paused) {
            video.play().catch(() => {});
          }
        } else {
          if (!video.paused) {
            video.pause();
          }
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      stopBarProg();
    };
  }, [scrollHeightVh, scrollStart, scrollEnd, playAtProgress, ready]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onProgress = () => {
      try {
        if (video.buffered.length && video.duration) {
          const end = video.buffered.end(video.buffered.length - 1);
          setLoadPct(Math.min(Math.round((end / video.duration) * 100), 100));
        }
      } catch {
        /* noop */
      }
    };

    const onLoaded = async () => {
      try {
        await video.play();
        video.pause();
      } catch {
        /* noop */
      }
      video.currentTime = 0;
      setReady(true);
    };

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.addEventListener("loadeddata", onLoaded, { once: true });
    video.addEventListener("progress", onProgress);
    video.load();

    return () => {
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("loadeddata", onLoaded);
    };
  }, [src]);

  const t = easeInOutCubic(smoothProgress);
  const inset = maskStartInset - t * (maskStartInset - maskEndInset);
  const clip = `inset(${inset.toFixed(2)}% ${inset.toFixed(2)}% ${inset.toFixed(2)}% ${inset.toFixed(2)}% round ${maskCornerRadius}px)`;

  const vw = viewport.w || (typeof window !== "undefined" ? window.innerWidth : 1920);
  const vh = viewport.h || (typeof window !== "undefined" ? window.innerHeight : 1080);

  const padX = 20 * (1 - t);
  const startW = (vw - padX * 2) * maskStartWidth;
  const startH = startW / 1.6;
  const endW = vw * maskEndScale;
  const endH = vh * maskEndScale;
  const maskW = startW + (endW - startW) * t;
  const maskH = startH + (endH - startH) * t;

  return (
    <>
      <div
        ref={containerRef}
        className="relative bg-[#f5f5f0] "
        style={{ height: `${scrollHeightVh}vh` }}
      >
        <div
          className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden"
          style={{
            paddingLeft: padX,
            paddingRight: padX,
            transition: "none",
          }}
        >
          <div
            className="pointer-events-none relative overflow-hidden rounded-lg bg-[#111] will-change-[width,height,clip-path]"
            style={{
              width: maskW,
              height: maskH,
              borderRadius: maskCornerRadius,
              clipPath: clip,
              transition: "none",
            }}
          >
            <video
              ref={videoRef}
              src={src}
              muted
              playsInline
              loop
              preload="auto"
              className="block h-full w-full object-cover"
            />

            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e] text-[11px] text-white/60 tabular-nums">
                Loading… {loadPct}%
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(255,255,255,0.03)_3px,rgba(255,255,255,0.03)_4px)]" />

            
          </div>
        </div>
      </div>

    
    </>
  );
}
