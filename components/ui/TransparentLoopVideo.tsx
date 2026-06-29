"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  className?: string;
  /** Video height; width follows aspect ratio. CSS length, e.g. "10vh". */
  height?: string;
  viewportThreshold?: number;
  /** When set, parent controls play/pause instead of viewport intersection. */
  playing?: boolean;
};

export default function TransparentLoopVideo({
  src,
  className = "",
  height = "10vh",
  viewportThreshold = 0.15,
  playing,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (playing !== undefined) return;

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
  }, [playing, viewportThreshold]);

  useEffect(() => {
    if (playing === undefined) return;

    const video = videoRef.current;
    if (!video) return;

    if (playing) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [playing]);

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
