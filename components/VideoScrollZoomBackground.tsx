"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

type Props = {
  src?: string;
  /** External scroll progress 0–1 */
  progress?: number;
  /** Prefer this over `progress` for frame-synced scroll scrubbing */
  progressRef?: RefObject<number>;
  maskStartInset?: number;
  maskEndInset?: number;
  maskStartWidth?: number;
  maskCornerRadius?: number;
  maskEndScale?: number;
  /** Fraction of element visible before playback starts */
  viewportThreshold?: number;
  className?: string;
};

function computeMask(
  p: number,
  vw: number,
  vh: number,
  maskStartInset: number,
  maskEndInset: number,
  maskStartWidth: number,
  maskCornerRadius: number,
  maskEndScale: number,
) {
  const inset = maskStartInset - p * (maskStartInset - maskEndInset);
  const clip = `inset(${inset.toFixed(2)}% ${inset.toFixed(2)}% ${inset.toFixed(2)}% ${inset.toFixed(2)}% round ${maskCornerRadius}px)`;
  const padX = 20 * (1 - p);
  const startW = (vw - padX * 2) * maskStartWidth;
  const startH = startW / (16 / 9);
  const endW = vw * maskEndScale;
  const endH = vh * maskEndScale;
  const maskW = startW + (endW - startW) * p;
  const maskH = startH + (endH - startH) * p;

  return { clip, padX, maskW, maskH };
}

export default function VideoScrollZoomBackground({
  src = "/makonis.ai_video.mp4",
  progress = 0,
  progressRef,
  maskStartInset = 30,
  maskEndInset = 0,
  maskStartWidth = 0.85,
  maskCornerRadius = 8,
  maskEndScale = 1.05,
  viewportThreshold = 0.15,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewportRef = useRef<{ w: number; h: number } | null>(null);

  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(false);
  const [viewport, setViewport] = useState<{ w: number; h: number } | null>(
    null,
  );

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateViewport = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setViewport({ w: width, h: height });
      }
    };

    updateViewport();
    const ro = new ResizeObserver(updateViewport);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const mask = maskRef.current;
    if (!container || !mask) return;

    let raf = 0;

    const apply = () => {
      const vp = viewportRef.current;
      const p = progressRef?.current ?? progress;

      if (vp) {
        const { clip, padX, maskW, maskH } = computeMask(
          p,
          vp.w,
          vp.h,
          maskStartInset,
          maskEndInset,
          maskStartWidth,
          maskCornerRadius,
          maskEndScale,
        );
        container.style.paddingLeft = `${padX}px`;
        container.style.paddingRight = `${padX}px`;
        mask.style.width = `${maskW}px`;
        mask.style.height = `${maskH}px`;
        mask.style.clipPath = clip;
        mask.style.visibility = "visible";
      }

      raf = requestAnimationFrame(apply);
    };

    raf = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(raf);
  }, [
    progress,
    progressRef,
    maskStartInset,
    maskEndInset,
    maskStartWidth,
    maskCornerRadius,
    maskEndScale,
  ]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: viewportThreshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [viewportThreshold]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !ready) return;

    if (inView) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [inView, ready]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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
    video.load();

    return () => {
      video.removeEventListener("loadeddata", onLoaded);
    };
  }, [src]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-0 flex items-center justify-center overflow-hidden ${className}`}
    >
      <div
        ref={maskRef}
        className="pointer-events-none relative overflow-hidden rounded-lg bg-[#111] will-change-[width,height,clip-path]"
        style={{
          borderRadius: maskCornerRadius,
          visibility: "hidden",
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
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e] text-[11px] text-white/60">
            Loading…
          </div>
        )}
      </div>
    </div>
  );
}
