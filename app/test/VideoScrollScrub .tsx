"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  src?: string;
  /** Lower = more glide/lag (0.05 buttery, 0.2 snappy). */
  glide?: number;
  /** Scroll distance as a multiple of viewport height. */
  scrollHeightVh?: number;
};

/**
 * VideoScrollScrub
 * ----------------
 * The video never autoplays. A hidden <video> is used purely as a frame source:
 * we decode it to a <canvas> and drive its time from scroll progress.
 *
 * Smoothness trick: scroll feeds a *target* time, and every animation frame we
 * ease the real playhead toward it (lerp). The video glides instead of snapping.
 */
export default function VideoScrollScrub({
  src = "/temp%20hero4.webm",
  glide = 0.06,
  scrollHeightVh = 400,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [ready, setReady] = useState(false);
  const [loadPct, setLoadPct] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const sticky = stickyRef.current;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!container || !sticky || !canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let rafId = 0;
    let running = false;
    let st: ScrollTrigger | null = null;

    // The playhead glide: target is fed by scroll, seek eases toward it.
    let targetTime = 0;
    let seekTime = 0;

    // --- Draw current video frame (object-fit: cover) ---
    const draw = () => {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.max(cw / vw, ch / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      ctx.drawImage(video, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    };

    // --- Ease the real playhead toward the scroll target, then draw ---
    const loop = () => {
      seekTime += (targetTime - seekTime) * glide;
      if (Math.abs(targetTime - seekTime) < 0.002) seekTime = targetTime;
      if (Math.abs(video.currentTime - seekTime) > 0.01) {
        video.currentTime = seekTime;
      }
      draw();
      rafId = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (running) return;
      running = true;
      loop();
    };
    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(rafId);
    };

    // --- Crisp canvas on resize / DPR ---
    const resize = () => {
      const w = sticky.clientWidth;
      const h = sticky.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      draw();
    };

    // --- Scroll progress -> target time (the lerp does the smoothing) ---
    const setupScrub = () => {
      const duration = video.duration;
      if (!duration || !isFinite(duration)) return;
      st = ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          targetTime = self.progress * duration;
        },
      });
      ScrollTrigger.refresh();
    };

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
      resize();
      try {
        await video.play();
        video.pause();
      } catch {
        /* autoplay may be blocked; muted canvas draw usually still works */
      }
      video.currentTime = 0;
      setReady(true);
      setupScrub();
      startLoop();
    };

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? startLoop() : stopLoop()),
      { threshold: 0 }
    );

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    video.addEventListener("loadeddata", onLoaded, { once: true });
    video.addEventListener("progress", onProgress);
    window.addEventListener("resize", resize);
    io.observe(sticky);

    video.load();

    return () => {
      stopLoop();
      io.disconnect();
      window.removeEventListener("resize", resize);
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("loadeddata", onLoaded);
      st?.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [src, glide]);

  return (
    <div
      ref={containerRef}
      style={{ height: `${scrollHeightVh}vh`, position: "relative", background: "#000" }}
    >
      <div
        ref={stickyRef}
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100%",
          overflow: "hidden",
        }}
      >
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          preload="auto"
          style={{ display: "none" }}
        />

        <canvas
          ref={canvasRef}
          style={{ display: "block", width: "100%", height: "100%" }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            color: "#fff",
            pointerEvents: "none",
            textShadow: "0 2px 20px rgba(0,0,0,0.45)",
          }}
        >
          <h1 style={{ fontSize: "clamp(2rem, 6vw, 5rem)", margin: 0, fontWeight: 700 }}>
            Scroll to Play
          </h1>
          <p style={{ opacity: 0.8, marginTop: "0.75rem", letterSpacing: "0.04em" }}>
            ↓ keep scrolling
          </p>
        </div>

        {!ready && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#000",
              color: "#fff",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Loading… {loadPct}%
          </div>
        )}
      </div>
    </div>
  );
}