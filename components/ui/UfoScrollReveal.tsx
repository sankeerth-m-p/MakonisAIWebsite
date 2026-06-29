"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  buildPathExportCode,
  buildSmoothPathD,
  getSectionEnterExitProgress,
  getSectionScrollProgress,
  samplePathAtProgress,
  samplePathAtProgressLinear,
  type PathKeyframe,
} from "@/lib/scrollPath";

import TransparentLoopVideo from "./TransparentLoopVideo";

type Props = {
  src: string;
  height?: string;
  className?: string;
  path: PathKeyframe[];
  /** Draw the smooth path line over the section. */
  showPath?: boolean;
  /** Click to place keyframes at the current scroll progress. Press Enter to copy path. */
  editorMode?: boolean;
  /** Path progress only moves forward; scrolling back does not reverse the UFO. */
  oneWay?: boolean;
  /** Straight A→B then B→C segments instead of a smooth curve. */
  linearPath?: boolean;
  /** `enter` = scroll into section; `enterExit` = enter (A→B) then leave (B→C). */
  progressMode?: "enter" | "enterExit";
};

export default function UfoScrollReveal({
  src,
  height = "30vh",
  className = "",
  path,
  showPath = false,
  editorMode = false,
  oneWay = false,
  linearPath = false,
  progressMode = "enter",
}: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<SVGSVGElement>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const maxPathProgressRef = useRef(0);

  const [editorKeyframes, setEditorKeyframes] = useState<PathKeyframe[]>(path);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [guideSize, setGuideSize] = useState({ w: 0, h: 0 });
  const [copied, setCopied] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const activePath = editorMode ? editorKeyframes : path;
  const samplePath = linearPath ? samplePathAtProgressLinear : samplePathAtProgress;

  const applyPosition = useCallback(
    (progress: number) => {
      const outer = outerRef.current;
      const section = sectionRef.current;
      if (!outer) return;

      const { x, y } = samplePath(activePath, progress);
      const w = section?.clientWidth ?? window.innerWidth;
      const h = section?.clientHeight ?? window.innerHeight;
      // Smaller at the start/end of the flight, full size in the middle.
      // sin(π·progress): 0 at the ends → 1 at the middle.
      const END_SCALE = 0.6; // size at A and C (1 = full size at B)
      const scale = END_SCALE + (1 - END_SCALE) * Math.sin(Math.PI * progress);
      // Move with translate3d (compositor-only) instead of left/top so the
      // glide stays buttery — no per-frame layout/paint.
      outer.style.transform = `translate3d(calc(${x * w}px - 50%), calc(${y * h}px - 50%), 0) scale(${scale})`;
    },
    [activePath, samplePath],
  );

  useEffect(() => {
    const outer = outerRef.current;
    const section = outer?.closest("section");
    if (!outer || !section) return;

    sectionRef.current = section;

    const readProgress = () =>
      progressMode === "enterExit"
        ? getSectionEnterExitProgress(section)
        : getSectionScrollProgress(section);

    const isSectionFullyOffScreen = () => {
      const rect = section.getBoundingClientRect();
      return rect.bottom <= 0 || rect.top >= window.innerHeight;
    };

    // Scroll only updates the *target*; a rAF loop eases the rendered value
    // toward it so the UFO glides smoothly instead of stepping per scroll tick.
    let target = readProgress();
    let current = target;
    let lastCurrent = current;
    let tilt = 0; // current rendered tilt (deg), eased toward velocity-driven target
    let raf = 0;
    let lastStateValue = -1;

    // Per-frame ease factor (0–1). Higher = snappier, lower = floatier glide.
    const SMOOTHING = 0.12;
    // Extra catch-up when far behind scroll — ease-out feel (fast start, slow settle).
    const EASE_OUT_BOOST = 3.5;
    // How strongly speed maps to forward lean, and how fast it settles flat.
    const TILT_PER_SPEED = 3000; // deg per unit-progress/frame of velocity
    const MAX_TILT = 16; // clamp so it never over-rotates
    const TILT_SMOOTHING = 0.18; // higher = catches the lean faster

    const readTarget = () => {
      const raw = readProgress();
      if (oneWay) {
        if (isSectionFullyOffScreen()) {
          maxPathProgressRef.current = 0;
          current = 0;
        }
        const next = Math.max(maxPathProgressRef.current, raw);
        maxPathProgressRef.current = next;
        return next;
      }
      return raw;
    };

    const tick = () => {
      target = readTarget();
      // Exponential lerp with ease-out bias: larger steps when far from target.
      const gap = target - current;
      const dist = Math.abs(gap);
      const alpha = Math.min(1, SMOOTHING * (1 + EASE_OUT_BOOST * (1 - (1 - dist) ** 2)));
      current += gap * alpha;
      if (Math.abs(target - current) < 0.0002) current = target;

      applyPosition(current);

      // Velocity = how far the UFO moved this frame. Moving forward leans the
      // craft into its motion; at rest it eases back to flat (level).
      const velocity = current - lastCurrent;
      lastCurrent = current;
      const tiltTarget = Math.max(
        -MAX_TILT,
        Math.min(MAX_TILT, velocity * TILT_PER_SPEED),
      );
      tilt += (tiltTarget - tilt) * TILT_SMOOTHING;
      const tiltEl = tiltRef.current;
      if (tiltEl) {
        // In-plane lean (rotate) — clearly visible on a flat video — plus a
        // touch of pitch for depth. Negative so the nose dips toward travel.
        tiltEl.style.transform = `rotate(${-tilt}deg) perspective(900px) rotateX(${tilt * 0.4}deg)`;
      }

      // Throttle React state updates (only used by the path overlay).
      if (Math.abs(current - lastStateValue) > 0.004) {
        lastStateValue = current;
        setScrollProgress(current);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [applyPosition, oneWay, progressMode]);

  useEffect(() => {
    applyPosition(scrollProgress);
  }, [activePath, applyPosition, scrollProgress]);

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

    const code = buildPathExportCode("UFO_PATH", sorted);
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      console.log("[UfoPathEditor] Copied:\n\n" + code);
      window.setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      console.log("[UfoPathEditor] Clipboard unavailable. Code:\n\n" + code);
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
      ? buildSmoothPathD(activePath, guideSize.w, guideSize.h, 0, 1, 72, linearPath)
      : "";
  const traveledPathD =
    guideSize.w > 0 && scrollProgress > 0
      ? buildSmoothPathD(activePath, guideSize.w, guideSize.h, 0, scrollProgress, 72, linearPath)
      : "";

  const sortedPath = [...activePath].sort((a, b) => a.t - b.t);

  return (
    <>
      {(showPath || editorMode) && guideSize.w > 0 && (
        <svg
          ref={guideRef}
          className={`absolute inset-0 z-30 ${editorMode ? "pointer-events-none" : "pointer-events-none"}`}
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
        className={`absolute left-0 top-0 z-50 ${className}`}
        style={{ transform: "translate3d(-50%, -50%, 0)", willChange: "transform" }}
      >
        <div
          ref={tiltRef}
          className={editorMode ? "pointer-events-none" : "cursor-pointer"}
          style={{ transformStyle: "preserve-3d" }}
        >
          <TransparentLoopVideo
            src={src}
            height={height}
            className="pointer-events-none"
          />
        </div>
      </div>
    </>
  );
}
