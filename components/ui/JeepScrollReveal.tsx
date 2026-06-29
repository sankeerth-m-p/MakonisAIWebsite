"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  buildPathExportCode,
  buildSmoothPathD,
  getSectionEnterExitProgress,
  samplePathAtProgressLinear,
  type PathKeyframe,
} from "@/lib/scrollPath";

import TransparentLoopVideo from "./TransparentLoopVideo";

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
};

const MAX_TILT = 3;
const TILT_PER_SPEED = 900;

export default function JeepScrollReveal({
  src = "/jeep.webm",
  height = "50vh",
  className = "",
  path = JEEP_PATH,
  showPath = false,
  editorMode = false,
}: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
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

    const { x, y } = samplePathAtProgressLinear(activePath, progress);
    const w = section?.clientWidth ?? window.innerWidth;
    const h = section?.clientHeight ?? window.innerHeight;
    outer.style.transform = `translate3d(calc(${x * w}px - 50%), calc(${y * h}px - 50%), 0)`;
  }, [activePath]);

  useEffect(() => {
    const outer = outerRef.current;
    const section = outer?.closest("section");
    if (!outer || !section) return;

    sectionRef.current = section;

    let target = getSectionEnterExitProgress(section);
    let current = target;
    let lastCurrent = current;
    let tilt = 0;
    let raf = 0;
    let lastStateValue = -1;

    const SMOOTHING = 0.28;
    const EASE_OUT_BOOST = 2.5;
    const TILT_SMOOTHING = 0.22;

    const tick = () => {
      target = getSectionEnterExitProgress(section);
      const gap = target - current;
      const dist = Math.abs(gap);
      const alpha = Math.min(1, SMOOTHING * (1 + EASE_OUT_BOOST * (1 - (1 - dist) ** 2)));
      current += gap * alpha;
      if (Math.abs(target - current) < 0.0002) current = target;

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

      if (Math.abs(current - lastStateValue) > 0.004) {
        lastStateValue = current;
        setScrollProgress(current);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [applyPosition]);

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
    <>
      {(showPath || editorMode) && guideSize.w > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 z-30"
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
          style={{ transformStyle: "preserve-3d", willChange: "transform" }}
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
