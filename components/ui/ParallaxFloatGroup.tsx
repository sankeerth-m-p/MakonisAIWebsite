"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Symmetric travel distance used when startY/endY are omitted. */
  shift?: number;
  /** toward = enters down / exits up, opposite = enters up / exits down */
  direction?: "toward" | "opposite";
  /** Static offset layered on top of the parallax motion */
  offsetY?: number;
  /** Optional explicit range, mapped from progress 0 -> 1. */
  startY?: number;
  endY?: number;
  as?: ElementType;
  style?: CSSProperties;
};

export default function ParallaxFloatGroup({
  children,
  className = "",
  shift = 100,
  direction = "toward",
  offsetY = 0,
  startY,
  endY,
  as: Tag = "div",
  style,
}: Props) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReducedMotion = () => setReducedMotion(media.matches);
    const frame = requestAnimationFrame(syncReducedMotion);

    media.addEventListener("change", syncReducedMotion);
    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener("change", syncReducedMotion);
    };
  }, []);

  useEffect(() => {
    const host = rootRef.current;
    if (!host) return;

    const section = host.closest("section") as HTMLElement | null;
    const target = section ?? host;

    let raf = 0;
    const updateProgress = () => {
      raf = 0;
      const rect = target.getBoundingClientRect();
      const total = rect.height + window.innerHeight;
      if (total <= 0) {
        setProgress(0);
        return;
      }

      const raw = (window.innerHeight - rect.top) / total;
      const clamped = Math.min(1, Math.max(0, raw));
      setProgress(clamped);
    };

    const onScrollOrResize = () => {
      if (raf) return;
      raf = requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  const rangeStart = startY ?? (direction === "toward" ? shift : -shift);
  const rangeEnd = endY ?? (direction === "toward" ? -shift : shift);
  const y = rangeStart + (rangeEnd - rangeStart) * progress;
  const translateY = reducedMotion ? offsetY : y + offsetY;

  return (
    <Tag
      ref={rootRef}
      className={`will-change-transform ${className}`.trim()}
      style={{
        ...style,
        transform: `translate3d(0, ${translateY}px, 0)`,
      }}
    >
      {children}
    </Tag>
  );
}
