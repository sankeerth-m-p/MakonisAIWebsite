"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  buildPathExportCode,
  buildSmoothPathD,
  getSectionEnterExitProgress,
  samplePathAtProgress,
  type PathKeyframe,
} from "@/lib/scrollPath";
import {
  drawSandParticles,
  getJeepDirtAnchor,
  JEEP_TRAVEL_DIR,
  spawnSandBurst,
  stepSandParticles,
  type SandParticle,
} from "@/lib/jeepSandTrail";

/** Default drive path — straight line along the bottom, right → center → left. */
export const JEEP_PATH: PathKeyframe[] = [
  { t: 0.0, x: 1.12, y: 0.9 }, // off-screen right
  { t: 0.5, x: 0.5, y: 0.9 }, // near center
  { t: 1.0, x: -0.12, y: 0.9 }, // off-screen left
];

type Props = {
  src?: string;
  height?: string;
  className?: string;
  path?: PathKeyframe[];
  showPath?: boolean;
  editorMode?: boolean;
  enableDirt?: boolean;
};

const MAX_TILT = 3;
const TILT_PER_SPEED = 900;
/** Progress delta per frame below which scroll is considered idle. */
const SCROLL_IDLE_THRESHOLD = 0.000001;
/** Pause video this many ms after the last detected scroll movement. */
const SCROLL_IDLE_MS = 28;
const MIN_PLAYBACK_RATE = 0.35;
const MAX_PLAYBACK_RATE = 2.8;
/** Maps per-frame path progress velocity to video playbackRate. */
const PLAYBACK_RATE_SCALE = 1500;

export default function JeepScrollReveal({
  src = "/jeep.webm",
  height = "60vh",
  className = "",
  path = JEEP_PATH,
  showPath = false,
  editorMode = false,
  enableDirt = true,
}: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const dirtAnchorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const sectionActiveRef = useRef(editorMode);
  const progressRef = useRef(0);

  const [editorKeyframes, setEditorKeyframes] = useState<PathKeyframe[]>(path);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [guideSize, setGuideSize] = useState({ w: 0, h: 0 });
  const [copied, setCopied] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const activePath = editorMode ? editorKeyframes : path;

  const applyPosition = useCallback((progress: number) => {
    const outer = outerRef.current;
    const section = sectionRef.current;
    if (!outer) return;

    const { x, y } = samplePathAtProgress(activePath, progress);
    const w = section?.clientWidth ?? window.innerWidth;
    const h = section?.clientHeight ?? window.innerHeight;
    outer.style.transform = `translate3d(calc(${x * w}px - 50%), calc(${y * h}px - 50%), 0)`;
  }, [activePath]);

  useEffect(() => {
    const outer = outerRef.current;
    const section = outer?.closest("section");
    if (!outer || !section) return;

    sectionRef.current = section;

    const isSectionFullyOffScreen = () => {
      const rect = section.getBoundingClientRect();
      return rect.bottom <= 0 || rect.top >= window.innerHeight;
    };

    const dirtEnabled =
      enableDirt &&
      !editorMode;

    const particles: SandParticle[] = [];
    let canvasW = 0;
    let canvasH = 0;
    let canvasDpr = 1;
    let lastHoverSpawn = 0;

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!dirtEnabled || !canvas) return false;
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return false;
      canvasDpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasW = section.clientWidth;
      canvasH = section.clientHeight;
      canvas.width = Math.max(1, Math.floor(canvasW * canvasDpr));
      canvas.height = Math.max(1, Math.floor(canvasH * canvasDpr));
      canvas.style.width = `${canvasW}px`;
      canvas.style.height = `${canvasH}px`;
      ctx.setTransform(canvasDpr, 0, 0, canvasDpr, 0, 0);
      return true;
    };

    const spawnAtAnchor = (speed: number) => {
      if (!dirtEnabled || speed <= 0) return;
      const anchorEl = dirtAnchorRef.current;
      if (!anchorEl) return;
      const anchor = getJeepDirtAnchor(anchorEl, section);
      spawnSandBurst(
        particles,
        anchor.x,
        anchor.y,
        JEEP_TRAVEL_DIR.dx,
        JEEP_TRAVEL_DIR.dy,
        speed,
        undefined,
        2,
      );
    };

    const paintParticles = () => {
      if (!dirtEnabled) return;
      if (canvasW <= 0 || canvasH <= 0) resizeCanvas();
      const canvas = canvasRef.current;
      if (!canvas || canvasW <= 0 || canvasH <= 0) return;
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return;
      ctx.setTransform(canvasDpr, 0, 0, canvasDpr, 0, 0);
      ctx.clearRect(0, 0, canvasW, canvasH);
      stepSandParticles(particles, canvasH, canvasW);
      drawSandParticles(ctx, particles, canvasW);
    };

    const onJeepPointerMove = () => {
      if (!dirtEnabled || !sectionActiveRef.current) return;
      const now = performance.now();
      if (now - lastHoverSpawn < 48) return;
      lastHoverSpawn = now;
      spawnAtAnchor(5);
    };

    const onJeepPointerLeave = () => {
      lastHoverSpawn = 0;
    };

    if (dirtEnabled) {
      resizeCanvas();
      outer.addEventListener("mouseenter", onJeepPointerMove);
      outer.addEventListener("mousemove", onJeepPointerMove);
      outer.addEventListener("mouseleave", onJeepPointerLeave);
      outer.addEventListener("touchstart", onJeepPointerMove, { passive: true });
      outer.addEventListener("touchmove", onJeepPointerMove, { passive: true });
      outer.addEventListener("touchend", onJeepPointerLeave, { passive: true });
    }

    let target = 0;
    let current = 0;
    let travel = 0;
    let anchorRaw = 0;
    let lastTravelFloor = 0;
    let lastCurrent = 0;
    let tilt = 0;
    let raf = 0;
    let lastStateValue = -1;
    let running = true;
    let sectionActive = editorMode;
    let dirtTravel = 0;
    let lastScrollInputAt = 0;

    const syncVideoToScroll = (scrollDelta: number) => {
      const video = videoRef.current;
      if (!video) return;

      const recentlyScrolled =
        scrollDelta > SCROLL_IDLE_THRESHOLD ||
        performance.now() - lastScrollInputAt < SCROLL_IDLE_MS;
      if (!recentlyScrolled) {
        if (!video.paused) video.pause();
        return;
      }

      const rate = Math.min(
        MAX_PLAYBACK_RATE,
        Math.max(MIN_PLAYBACK_RATE, scrollDelta * PLAYBACK_RATE_SCALE),
      );
      if (Math.abs(video.playbackRate - rate) > 0.02) {
        video.playbackRate = rate;
      }
      if (video.paused) {
        void video.play().catch(() => {});
      }
    };

    const pauseVideo = () => {
      const video = videoRef.current;
      if (video && !video.paused) video.pause();
    };

    const SMOOTHING = 0.16;
    const EASE_OUT_BOOST = 1.8;
    const TILT_SMOOTHING = 0.14;
    // Emit one dirt burst per this much accumulated progress travel.
    const DIRT_SPAWN_STEP = 0.00065;

    const readTarget = () => {
      const raw = getSectionEnterExitProgress(section);
      if (isSectionFullyOffScreen()) {
        travel = 0;
        anchorRaw = 0;
        lastTravelFloor = 0;
        current = 0;
        lastCurrent = 0;
        dirtTravel = 0;
        particles.length = 0;
        return 0;
      }

      if (raw !== anchorRaw) {
        travel += Math.abs(raw - anchorRaw);
        anchorRaw = raw;
      }

      return travel % 1;
    };

    const advanceProgress = (progress: number, progressTarget: number, wrappedLap: boolean) => {
      if (wrappedLap) return progressTarget;
      const gap = progressTarget - progress;
      const dist = Math.abs(gap);
      const alpha = Math.min(1, SMOOTHING * (1 + EASE_OUT_BOOST * (1 - (1 - dist) ** 2)));
      let next = progress + gap * alpha;
      if (Math.abs(progressTarget - next) < 0.0002) next = progressTarget;
      return next;
    };

    const scheduleTick = () => {
      if (raf || !running) return;
      raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      raf = 0;
      if (!running) return;

      const animateJeep = editorMode || sectionActive;

      if (animateJeep) {
        const prevTravelFloor = lastTravelFloor;
        const anchorBefore = anchorRaw;
        target = readTarget();
        const scrollDelta = Math.abs(anchorRaw - anchorBefore);
        if (scrollDelta > SCROLL_IDLE_THRESHOLD) {
          lastScrollInputAt = performance.now();
        }
        lastTravelFloor = Math.floor(travel);

        const wrappedLap = lastTravelFloor > prevTravelFloor;
        current = wrappedLap ? target : advanceProgress(current, target, false);

        progressRef.current = current;
        applyPosition(current);

        const velocity = current - lastCurrent;
        lastCurrent = current;
        const tiltTarget = Math.max(
          -MAX_TILT,
          Math.min(MAX_TILT, velocity * TILT_PER_SPEED),
        );
        tilt += (tiltTarget - tilt) * TILT_SMOOTHING;

        const tiltEl = tiltRef.current;
        if (tiltEl) {
          tiltEl.style.transform = `rotate(${tilt}deg) perspective(900px) rotateX(${-tilt * 0.25}deg)`;
        }

        // Spawn dirt based on accumulated travel distance, not raw per-frame
        // velocity. Smoothed/slow scrolling makes the frame velocity dip below a
        // fixed threshold and the trail flickers in and out ("not coming
        // sometimes"). Accumulating distance and emitting per fixed step gives a
        // continuous trail at any scroll speed.
        if (dirtEnabled && Math.abs(velocity) > 0.00002) {
          dirtTravel += Math.abs(velocity);
          while (dirtTravel >= DIRT_SPAWN_STEP) {
            dirtTravel -= DIRT_SPAWN_STEP;
            const scrollSpeed = Math.max(
              2.4,
              Math.abs(velocity) * section.clientWidth * 4.5,
            );
            spawnAtAnchor(scrollSpeed);
          }
        }

        syncVideoToScroll(scrollDelta);

        if (Math.abs(current - lastStateValue) > 0.004) {
          lastStateValue = current;
          setScrollProgress(current);
        }
      } else {
        pauseVideo();
      }

      if (dirtEnabled && sectionActive) {
        paintParticles();
      }

      if (animateJeep || (dirtEnabled && sectionActive)) {
        scheduleTick();
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        sectionActive = entry.isIntersecting;
        sectionActiveRef.current = sectionActive;
        if (!entry.isIntersecting) {
          particles.length = 0;
          lastHoverSpawn = 0;
          dirtTravel = 0;
          pauseVideo();
        } else if (dirtEnabled) {
          resizeCanvas();
        }
        if (editorMode || sectionActive) scheduleTick();
      },
      { rootMargin: "160px 0px", threshold: 0 },
    );
    observer.observe(section);

    const canvasRo = dirtEnabled ? new ResizeObserver(resizeCanvas) : null;
    canvasRo?.observe(section);

    target = readTarget();
    current = target;
    lastCurrent = current;

    const rect = section.getBoundingClientRect();
    const initiallyVisible = rect.bottom > 0 && rect.top < window.innerHeight;
    if (initiallyVisible) {
      sectionActive = true;
      sectionActiveRef.current = true;
    }
    if (dirtEnabled) {
      requestAnimationFrame(() => {
        resizeCanvas();
        scheduleTick();
      });
    } else {
      scheduleTick();
    }

    return () => {
      running = false;
      observer.disconnect();
      canvasRo?.disconnect();
      if (dirtEnabled) {
        outer.removeEventListener("mouseenter", onJeepPointerMove);
        outer.removeEventListener("mousemove", onJeepPointerMove);
        outer.removeEventListener("mouseleave", onJeepPointerLeave);
        outer.removeEventListener("touchstart", onJeepPointerMove);
        outer.removeEventListener("touchmove", onJeepPointerMove);
        outer.removeEventListener("touchend", onJeepPointerLeave);
      }
      cancelAnimationFrame(raf);
    };
  }, [applyPosition, editorMode, enableDirt]);

  useEffect(() => {
    applyPosition(progressRef.current);
  }, [activePath, applyPosition]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || (!showPath && !editorMode)) return;

    const sync = () => {
      setGuideSize({ w: section.clientWidth, h: section.clientHeight });
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(section);
    return () => ro.disconnect();
  }, [showPath, editorMode]);

  const placeKeyframe = useCallback(
    (clientX: number, clientY: number) => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const x = parseFloat(((clientX - rect.left) / rect.width).toFixed(4));
      const y = parseFloat(((clientY - rect.top) / rect.height).toFixed(4));
      const t = parseFloat(scrollProgress.toFixed(4));
      const kf: PathKeyframe = { t, x, y };

      setEditorKeyframes((prev) => {
        const filtered = prev.filter((k) => Math.abs(k.t - t) > 0.02);
        return [...filtered, kf];
      });
      setFlash(`t=${t.toFixed(3)}  x=${x.toFixed(3)}  y=${y.toFixed(3)}`);
      window.setTimeout(() => setFlash(null), 900);
    },
    [scrollProgress],
  );

  const copyPath = useCallback(() => {
    const sorted = [...editorKeyframes].sort((a, b) => a.t - b.t);
    if (sorted.length < 2) return;

    const code = buildPathExportCode("JEEP_PATH", sorted);
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      console.log("[JeepPathEditor] Copied:\n\n" + code);
      window.setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      console.log("[JeepPathEditor] Clipboard unavailable. Code:\n\n" + code);
    });
  }, [editorKeyframes]);

  useEffect(() => {
    if (!editorMode) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        copyPath();
        return;
      }
      if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setEditorKeyframes((prev) => prev.slice(0, -1));
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copyPath, editorMode]);

  const fullPathD =
    guideSize.w > 0
      ? buildSmoothPathD(activePath, guideSize.w, guideSize.h, 0, 1, 72, true)
      : "";
  const traveledPathD =
    guideSize.w > 0 && scrollProgress > 0
      ? buildSmoothPathD(activePath, guideSize.w, guideSize.h, 0, scrollProgress, 72, true)
      : "";

  const sortedPath = [...activePath].sort((a, b) => a.t - b.t);

  return (
    <div className="pointer-events-none absolute inset-0 z-[25]">
      {enableDirt && !editorMode && (
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 block h-full w-full"
          aria-hidden
        />
      )}

      {(showPath || editorMode) && guideSize.w > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 z-20"
          width={guideSize.w}
          height={guideSize.h}
          aria-hidden
        >
          {fullPathD && (
            <path
              d={fullPathD}
              fill="none"
              stroke="rgba(255,200,120,0.32)"
              strokeWidth={2}
              strokeDasharray="8 6"
              strokeLinecap="round"
            />
          )}
          {traveledPathD && (
            <path
              d={traveledPathD}
              fill="none"
              stroke="rgba(255,180,60,0.78)"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          )}
          {sortedPath.map((kf) => {
            const isActive = Math.abs(kf.t - scrollProgress) < 0.03;
            return (
              <g key={`${kf.t}-${kf.x}-${kf.y}`}>
                <circle
                  cx={kf.x * guideSize.w}
                  cy={kf.y * guideSize.h}
                  r={isActive ? 7 : 5}
                  fill={
                    kf.t <= 0.01
                      ? "rgba(80,220,120,0.9)"
                      : kf.t >= 0.99
                        ? "rgba(255,80,80,0.9)"
                        : "rgba(255,200,100,0.88)"
                  }
                  stroke="rgba(255,255,255,0.55)"
                  strokeWidth={1.5}
                />
              </g>
            );
          })}
        </svg>
      )}

      {editorMode && (
        <div
          className="absolute inset-0 z-40 cursor-crosshair"
          onClick={(e) => placeKeyframe(e.clientX, e.clientY)}
        >
          <div className="pointer-events-none absolute top-4 left-1/2 z-50 -translate-x-1/2 rounded-md bg-black/75 px-4 py-2 font-mono text-xs text-amber-100">
            Scroll to set progress ({scrollProgress.toFixed(3)}) → click to place pin · Enter copy path ·
            Ctrl+Z undo
            {copied ? " · Copied!" : ""}
          </div>
          {flash && (
            <div className="pointer-events-none absolute bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md bg-emerald-400 px-4 py-2 font-mono text-xs font-bold text-black">
              {flash}
            </div>
          )}
        </div>
      )}

      <div
        ref={outerRef}
        className={`pointer-events-auto absolute left-0 top-0 z-10 ${className}`}
        style={{ transform: "translate3d(-50%, -50%, 0)", willChange: "transform" }}
      >
        <div
          ref={tiltRef}
          style={{ transformStyle: "preserve-3d", willChange: "transform" }}
        >
          <div className="relative inline-block">
            <video
              ref={videoRef}
              src={src}
              muted
              playsInline
              loop
              preload="auto"
              aria-hidden
              className="pointer-events-none block w-auto object-contain"
              style={{ height }}
            />
            <div
              ref={dirtAnchorRef}
              className="pointer-events-none absolute"
              style={{ right: "8%", top: "78%", width: 0, height: 0 }}
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  );
}
