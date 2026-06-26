"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  className?: string;
  /** Video height; width follows aspect ratio. CSS length, e.g. "10vh". */
  height?: string;
  viewportThreshold?: number;
};

export default function TransparentLoopVideo({
  src,
  className = "",
  height = "10vh",
  viewportThreshold = 0.15,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: viewportThreshold },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [viewportThreshold]);

  return (
    <div ref={containerRef} className={className}>
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        loop
        preload="auto"
        aria-hidden
        className="block w-auto object-contain"
        style={{ height }}
      />
    </div>
  );
}
