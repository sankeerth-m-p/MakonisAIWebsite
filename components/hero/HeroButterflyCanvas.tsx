"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { preload } from "react-dom";

// ---------------------------------------------------------------------------
// Path system
// ---------------------------------------------------------------------------

export type PathKeyframe = {
  /**
   * Video progress (0..1) — videoCurrentTime / videoDuration
   * 0 = video start, 1 = video end
   */
  t: number;
  /** X as fraction of canvas width. <0 = off-screen left, >1 = off-screen right */
  x: number;
  /** Y as fraction of canvas height. 0 = top, 1 = bottom */
  y: number;
};

/**
 * Default: butterfly waits off-screen right before video starts,
 * then flies in and follows a path as the video plays.
 */
export const DEFAULT_BUTTERFLY_PATH: PathKeyframe[] = [
  { t: 0.0, x: 1.45, y: 0.52 },
  { t: 0.3, x: 0.88, y: 0.44 },
  { t: 0.6, x: 0.52, y: 0.40 },
  { t: 1.0, x: 0.08, y: 0.50 },
];

/** Tuned path — keyframe `t` is video progress (0 = video start, 1 = video end). */
export const CUSTOM_BUTTERFLY_PATH: PathKeyframe[] = [
  { t: 0.0, x: 0.9993, y: 0.7752 }, // before video starts — off-screen right
{ t: 0.04, x: 0.8053, y: 0.5312 },
  // Sitting segment: smooth upward incline (no mid dip).
  { t: 0.145, x: 0.625, y: 0.492 },
  // { t: 0.188, x: 0.4499, y: 0.358 },
  { t: 0.232, x: 0.2747, y: 0.224 },
  { t: 0.277, x: 0.1725, y: 0.2903 },
  { t: 0.35, x: 0.304, y: 0.4801 },
  { t: 0.457, x: 0.5299, y: 0.3589 },
  { t: 0.561, x: 0.1999, y: 0.4929 },
  { t: 0.653, x: 0.0938, y: 0.1356 },
  { t: 0.782, x: 0.252, y: 0.327 },
  { t: 0.841, x: 0.3366, y: 0.6381 },
  { t: 0.922, x: 0.3854, y: 0.8949 },
  { t: 1.2, x: 0.4193, y: 1.6 }, // video end
];

function lerpPath(path: PathKeyframe[], p: number): { x: number; y: number } {
  if (path.length === 0) return { x: 1.5, y: 0.5 };
  if (p <= path[0].t) return { x: path[0].x, y: path[0].y };
  if (p >= path[path.length - 1].t) {
    const last = path[path.length - 1];
    return { x: last.x, y: last.y };
  }
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    if (p >= a.t && p <= b.t) {
      const frac = (p - a.t) / (b.t - a.t || 1);
      return { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
    }
  }
  const last = path[path.length - 1];
  return { x: last.x, y: last.y };
}

/** Minimum horizontal delta (path fraction) before we treat direction as changed. */
const FLIP_DIRECTION_THRESHOLD = 0.003;
/** Look-ahead along the path when inferring travel direction. */
const FLIP_LOOKAHEAD = 0.025;

function pathHorizontalDelta(path: PathKeyframe[], p: number): number {
  const current = lerpPath(path, p);
  const ahead = lerpPath(path, Math.min(1, p + FLIP_LOOKAHEAD));
  return ahead.x - current.x;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Slow wing flap when scroll is idle (frames per second). */
const IDLE_WING_FPS         = 9;
/** Extra wing advance per unit of scroll progress while moving. */
const FLYING_WING_SCALE     = 140;
/** Slow sitting idle flap (frames per second). */
const SITTING_IDLE_FPS      = 7;
/** Extra sitting frame advance per unit of scroll progress. */
const SITTING_SCROLL_SCALE  = 80;
const FLYING_START_PROGRESS = 0.02;
const BUTTERFLY_SIZE        = 350;
const MOBILE_BUTTERFLY_SIZE = 150;
const PATH_LINE_STEPS       = 80;
const TAKEOFF_FRAME_COUNT   = 27;
/** Load/render every Nth takeoff frame to keep takeoff snappier. */
const TAKEOFF_FRAME_STRIDE  = 3;
const SITTING_FRAME_COUNT   = 33;
const FLYING_FRAME_COUNT    = 8;
const FIRST_SITTING_FRAME   = 6;
const TAKEOFF_PATH = "/butterfly/takeoff";
const SITTING_PATH = "/butterfly/sitting";
const FLYING_PATH  = "/butterfly/flying";
/** Duration of each half of a direction-change flip transition. */
const DIRECTION_FLIP_PHASE_SECONDS = 0.46;
/** Skip the flip animation when scroll moves this fast (progress units / frame). */
const FAST_SCROLL_FLIP_SKIP = 0.006;
/** Progress span used for each takeoff transition segment. */
const TAKEOFF_TRANSITION_SPAN = 0.018;
/** Only this center fraction of each window uses sitting frames. */
const SITTING_CORE_FRACTION = 0.38;
const SITTING_POSE_WINDOWS: Array<{ start: number; end: number }> = [
  // Hold a perched/sitting-style body while still flapping.
  { start: 0.145, end: 0.232 },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HeroButterflyCanvasProps = {
  /**
   * Video progress ref — set this to videoEl.currentTime / videoEl.duration
   * in your scroll/video sync logic. Range 0..1.
   */
  progressRef: RefObject<number>;
  path?: PathKeyframe[];
  showPath?: boolean;
  /** Debug/testing: show keyframe points without enabling full path line. */
  showPathPoints?: boolean;
  /**
   * Dev-only path editor. Shows your hero video, lets you scrub to any
   * frame and click where the butterfly should be at that video progress.
   * Press Enter to copy the PathKeyframe[] array. Remove in production.
   */
  editorMode?: boolean;
  /** Same video src your hero uses — shown inside the editor for reference. */
  editorVideoSrc?: string;
};

// ---------------------------------------------------------------------------
// Image loading
// ---------------------------------------------------------------------------

function pad(n: number) { return String(n).padStart(4, "0"); }
const sittingFrameSrc = (i: number) => `${SITTING_PATH}/sitting_frame_${pad(i)}.png`;
const takeoffFrameSrc = (i: number) => `${TAKEOFF_PATH}/takeoff_frame_${pad(i)}.png`;
const flyingFrameSrc  = (i: number) => `${FLYING_PATH}/flying_frame_${pad(i)}.png`;

async function loadImage(src: string) {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  try { await img.decode(); } catch {
    if (!img.complete) await new Promise<void>((res, rej) => {
      img.onload  = () => res();
      img.onerror = () => rej(new Error(`Failed: ${src}`));
    });
  }
  return img;
}

function whenBrowserIsIdle(cb: () => void) {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(cb, { timeout: 1200 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(cb, 100);
  return () => clearTimeout(id);
}

function isMobile() { return window.innerWidth < 768; }
type PoseStage = "sitting" | "takeoffIn" | "takeoffOut" | "flying";
function getSittingCoreBounds(start: number, end: number) {
  const span = Math.max(0, end - start);
  const coreSpan = span * SITTING_CORE_FRACTION;
  const trim = (span - coreSpan) / 2;
  return {
    coreStart: start + trim,
    coreEnd: end - trim,
  };
}

function getPoseStage(progress: number): PoseStage {
  for (const { start, end } of SITTING_POSE_WINDOWS) {
    const { coreStart, coreEnd } = getSittingCoreBounds(start, end);
    const takeoffInStart = coreStart - TAKEOFF_TRANSITION_SPAN;
    const takeoffInEnd = coreStart;
    const takeoffOutStart = coreEnd;
    const takeoffOutEnd = coreEnd + TAKEOFF_TRANSITION_SPAN;

    if (progress >= takeoffInStart && progress < takeoffInEnd) return "takeoffIn";
    if (progress >= coreStart && progress < coreEnd) return "sitting";
    if (progress >= takeoffOutStart && progress < takeoffOutEnd) return "takeoffOut";
  }
  return "flying";
}

function getTakeoffTransitionFrameIndex(progress: number, reverse: boolean, frameCount: number) {
  if (frameCount <= 1) return 0;
  for (const { start, end } of SITTING_POSE_WINDOWS) {
    const { coreStart, coreEnd } = getSittingCoreBounds(start, end);
    const from = reverse ? coreStart - TAKEOFF_TRANSITION_SPAN : coreEnd;
    const to = reverse ? coreStart : coreEnd + TAKEOFF_TRANSITION_SPAN;
    if (progress < from || progress >= to) continue;
    const t = Math.max(0, Math.min(1, (progress - from) / (to - from || 1)));
    const takeoffT = reverse ? 1 - t : t;
    return Math.floor(takeoffT * (frameCount - 1));
  }
  return reverse ? frameCount - 1 : 0;
}

function getTakeoffFrameIndexByPhaseT(t: number, reverse: boolean, frameCount: number) {
  if (frameCount <= 1) return 0;
  const clamped = Math.max(0, Math.min(1, t));
  const takeoffT = reverse ? 1 - clamped : clamped;
  return Math.floor(takeoffT * (frameCount - 1));
}

function drawPathGuide(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  path: PathKeyframe[],
  progress: number,
  opts?: { showLine?: boolean; showPoints?: boolean },
) {
  const showLine = opts?.showLine ?? true;
  const showPoints = opts?.showPoints ?? true;
  const px = (x: number) => x * canvas.width;
  const py = (y: number) => y * canvas.height;

  if (showLine) {
    ctx.beginPath();
    for (let i = 0; i <= PATH_LINE_STEPS; i++) {
      const { x, y } = lerpPath(path, i / PATH_LINE_STEPS);
      if (i === 0) ctx.moveTo(px(x), py(y));
      else ctx.lineTo(px(x), py(y));
    }
    ctx.strokeStyle = "rgba(255,200,120,0.35)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    if (progress > 0) {
      ctx.beginPath();
      const steps = Math.max(2, Math.ceil(PATH_LINE_STEPS * progress));
      for (let i = 0; i <= steps; i++) {
        const { x, y } = lerpPath(path, (i / steps) * progress);
        if (i === 0) ctx.moveTo(px(x), py(y));
        else ctx.lineTo(px(x), py(y));
      }
      ctx.strokeStyle = "rgba(255,180,60,0.75)";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }

  if (showPoints) {
    for (const kf of path) {
      ctx.beginPath();
      ctx.arc(px(kf.x), py(kf.y), 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,210,100,0.85)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function buildTSCode(kfs: PathKeyframe[]): string {
  const sorted = [...kfs].sort((a, b) => a.t - b.t);
  const lines  = sorted.map((k, i) => {
    const comment =
      i === 0                ? " // before video starts — off-screen right"
      : i === sorted.length - 1 ? " // video end"
      : "";
    return `  { t: ${k.t.toFixed(3)}, x: ${k.x.toFixed(4)}, y: ${k.y.toFixed(4)} },${comment}`;
  });
  return `export const CUSTOM_BUTTERFLY_PATH: PathKeyframe[] = [\n${lines.join("\n")}\n];`;
}

// ---------------------------------------------------------------------------
// Path editor overlay
// ---------------------------------------------------------------------------

function PathEditorOverlay({ videoSrc, onClose }: { videoSrc?: string; onClose: () => void }) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);

  const [keyframes, setKeyframes] = useState<PathKeyframe[]>([]);
  const [videoDur, setVideoDur]   = useState(0);
  const [videoT, setVideoT]       = useState(0);
  const [copied, setCopied]       = useState(false);
  const [hoverPos, setHoverPos]   = useState<{ x: number; y: number } | null>(null);
  const [flashMsg, setFlashMsg]   = useState<string | null>(null);

  const sortedKfs   = [...keyframes].sort((a, b) => a.t - b.t);
  // video progress 0..1
  const videoProgress = videoDur > 0 ? videoT / videoDur : 0;

  // ── canvas repaint ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (sortedKfs.length >= 2) {
      // smooth curve
      ctx.beginPath();
      ctx.moveTo(sortedKfs[0].x * W, sortedKfs[0].y * H);
      for (let i = 1; i < sortedKfs.length - 1; i++) {
        const cx = sortedKfs[i].x * W,     cy = sortedKfs[i].y * H;
        const nx = sortedKfs[i+1].x * W,   ny = sortedKfs[i+1].y * H;
        ctx.quadraticCurveTo(cx, cy, (cx+nx)/2, (cy+ny)/2);
      }
      ctx.lineTo(sortedKfs[sortedKfs.length-1].x * W, sortedKfs[sortedKfs.length-1].y * H);
      ctx.strokeStyle = "rgba(255,200,100,0.65)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // butterfly preview at current video progress
      const pos = lerpPath(sortedKfs, videoProgress);
      const bx  = pos.x * W;
      const by  = pos.y * H;
      // glow ring
      ctx.beginPath();
      ctx.arc(bx, by, 16, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,200,100,0.1)";
      ctx.fill();
      // dot
      ctx.beginPath();
      ctx.arc(bx, by, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,200,100,0.9)";
      ctx.fill();
      // direction arrow
      const dir = pathHorizontalDelta(sortedKfs, videoProgress) < 0;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "bold 13px monospace";
      ctx.fillText(dir ? "←" : "→", bx + 14, by + 5);
    }

    // keyframe pins
    for (let i = 0; i < sortedKfs.length; i++) {
      const kf      = sortedKfs[i];
      const pinX    = kf.x * W;
      const pinY    = kf.y * H;
      const isFirst  = i === 0;
      const isLast   = i === sortedKfs.length - 1;
      const isActive = Math.abs(kf.t - videoProgress) < 0.015;

      ctx.beginPath();
      ctx.arc(pinX, pinY, isActive ? 9 : 7, 0, Math.PI * 2);
      ctx.fillStyle = isFirst
        ? "rgba(80,220,120,0.95)"
        : isLast ? "rgba(255,80,80,0.95)"
        : "rgba(255,200,100,0.9)";
      ctx.fill();
      ctx.strokeStyle = isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)";
      ctx.lineWidth = isActive ? 2 : 1.5;
      ctx.stroke();

      // time label
      const label = `${kf.t.toFixed(2)}s`;
      ctx.font = "bold 10px monospace";
      const tw = ctx.measureText(label).width;
      const lx = pinX + 12, ly = pinY - 6;
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.beginPath();
      ctx.roundRect?.(lx - 3, ly - 12, tw + 8, 16, 4);
      ctx.fill();
      ctx.fillStyle = "rgba(255,220,120,1)";
      ctx.fillText(label, lx + 1, ly);
    }

    // hover crosshair
    if (hoverPos) {
      const hx = hoverPos.x * W;
      const hy = hoverPos.y * H;
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(hx, 0); ctx.lineTo(hx, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(W, hy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(hx, hy, 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fill();
      const timeFrac = videoDur > 0 ? videoT / videoDur : 0;
      const info = `click → t=${timeFrac.toFixed(3)} (${videoT.toFixed(1)}s)  x=${hoverPos.x.toFixed(3)}  y=${hoverPos.y.toFixed(3)}`;
      ctx.font = "11px monospace";
      const infoW = ctx.measureText(info).width;
      const lbx   = Math.min(hx + 12, W - infoW - 16);
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(lbx - 2, hy - 20, infoW + 8, 16);
      ctx.fillStyle = "rgba(180,210,255,0.95)";
      ctx.fillText(info, lbx + 2, hy - 7);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyframes, videoProgress, hoverPos]);

  // ── canvas resize ────────────────────────────────────────────────────────
  useEffect(() => {
    const sync = () => {
      const canvas  = canvasRef.current;
      const overlay = overlayRef.current;
      if (!canvas || !overlay) return;
      canvas.width  = overlay.clientWidth;
      canvas.height = overlay.clientHeight;
    };
    sync();
    const ro = new ResizeObserver(sync);
    if (overlayRef.current) ro.observe(overlayRef.current);
    return () => ro.disconnect();
  }, []);

  // ── click = place keyframe at current video time ─────────────────────────
  const onOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const overlay = overlayRef.current;
    if (!overlay || videoDur === 0) return;
    const r  = overlay.getBoundingClientRect();
    const xf = parseFloat(((e.clientX - r.left) / r.width).toFixed(4));
    const yf = parseFloat(((e.clientY - r.top)  / r.height).toFixed(4));
    const t  = parseFloat((videoT / videoDur).toFixed(4));
    const kf: PathKeyframe = { t, x: xf, y: yf };
    setKeyframes(prev => {
      // replace any existing pin within ±0.01 of this t
      const filtered = prev.filter(k => Math.abs(k.t - t) > 0.01);
      return [...filtered, kf];
    });
    setFlashMsg(`✓ t=${t.toFixed(3)} (${videoT.toFixed(1)}s)  x=${xf.toFixed(3)}  y=${yf.toFixed(3)}`);
    setTimeout(() => setFlashMsg(null), 900);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const r = overlay.getBoundingClientRect();
    setHoverPos({
      x: parseFloat(((e.clientX - r.left) / r.width).toFixed(4)),
      y: parseFloat(((e.clientY - r.top)  / r.height).toFixed(4)),
    });
  };

  // ── copy ─────────────────────────────────────────────────────────────────
  const doCopy = () => {
    if (sortedKfs.length < 2) return;
    const code = buildTSCode(sortedKfs);
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      console.log("[PathEditor] Copied:\n\n" + code);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      console.log("[PathEditor] Clipboard unavailable. Code:\n\n" + code);
    });
  };

  // ── keyboard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter")  { doCopy(); return; }
      if (e.key === "Escape") { onClose(); return; }
      if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setKeyframes(prev => prev.slice(0, -1));
      }
      // space = play/pause video
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) void v.play();
        else v.pause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedKfs]);

  const fmt = (s: number) => {
    const m   = Math.floor(s / 60);
    const sec = (s % 60).toFixed(2).padStart(5, "0");
    return `${m}:${sec}`;
  };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 100,
      display: "flex", flexDirection: "column",
      background: "#000", fontFamily: "monospace",
    }}>

      {/* video + click area */}
      <div
        ref={overlayRef}
        style={{ position: "relative", flex: 1, overflow: "hidden", cursor: "crosshair" }}
        onClick={onOverlayClick}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHoverPos(null)}
      >
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
            onLoadedMetadata={() => { if (videoRef.current) setVideoDur(videoRef.current.duration); }}
            onTimeUpdate={() => { if (videoRef.current) setVideoT(videoRef.current.currentTime); }}
            muted
            playsInline
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "repeating-linear-gradient(45deg,#0d0d0d 0,#0d0d0d 12px,#141414 12px,#141414 24px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 13, textAlign: "center", lineHeight: 2 }}>
              No video.<br />
              Pass <code style={{ background:"rgba(255,255,255,0.07)", padding:"1px 6px", borderRadius:3 }}>editorVideoSrc</code> prop.
            </p>
          </div>
        )}

        {/* pins + path canvas */}
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        />

        {/* flash */}
        {flashMsg && (
          <div style={{
            position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
            background: "rgba(80,220,120,0.92)", color: "#000",
            padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: "bold",
            pointerEvents: "none", whiteSpace: "nowrap",
          }}>
            {flashMsg}
          </div>
        )}

        {/* top-right badge */}
        <div style={{
          position: "absolute", top: 10, right: 12,
          background: "rgba(255,150,50,0.1)", border: "1px solid rgba(255,170,60,0.3)",
          borderRadius: 6, padding: "3px 10px",
          fontSize: 11, color: "rgba(255,210,120,0.8)",
          pointerEvents: "none", letterSpacing: "0.04em",
        }}>
          PATH EDITOR · Esc to close
        </div>

        {/* top-left counter */}
        <div style={{
          position: "absolute", top: 10, left: 12,
          background: "rgba(0,0,0,0.6)", borderRadius: 6, padding: "4px 10px",
          fontSize: 11, color: "rgba(255,255,255,0.6)", pointerEvents: "none",
        }}>
          {sortedKfs.length === 0
            ? "Scrub video → click to place a pin"
            : sortedKfs.length === 1
            ? "1 pin placed · need ≥ 2"
            : `${sortedKfs.length} pins · Enter to copy`}
        </div>
      </div>

      {/* bottom bar */}
      <div style={{
        background: "rgba(8,8,8,0.98)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "10px 16px", flexShrink: 0,
        display: "flex", flexDirection: "column", gap: 9,
      }}>

        {/* video scrub */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={e => {
              e.stopPropagation();
              const v = videoRef.current;
              if (!v) return;
              if (v.paused) void v.play();
              else v.pause();
            }}
            style={{
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 4, color: "rgba(255,255,255,0.7)", fontSize: 11,
              padding: "3px 10px", cursor: "pointer", flexShrink: 0,
            }}
          >
            ▶ / ⏸ &nbsp;<span style={{ opacity: 0.4, fontSize: 10 }}>Space</span>
          </button>

          <input
            type="range" min={0} max={videoDur || 100} step={0.033}
            value={videoT}
            onChange={e => {
              e.stopPropagation();
              const t = parseFloat(e.target.value);
              if (videoRef.current) videoRef.current.currentTime = t;
              setVideoT(t);
            }}
            onClick={e => e.stopPropagation()}
            style={{ flex: 1, accentColor: "#f0a040" }}
          />

          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", minWidth: 80, textAlign: "right" }}>
            {fmt(videoT)} / {fmt(videoDur)}
          </span>

          <span style={{
            fontSize: 11, minWidth: 54, textAlign: "right",
            color: "rgba(100,190,255,0.8)",
          }}>
            t={videoDur > 0 ? (videoT / videoDur).toFixed(3) : "0.000"}
          </span>
        </div>

        {/* actions + pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={e => { e.stopPropagation(); setKeyframes(prev => prev.slice(0, -1)); }}
            disabled={keyframes.length === 0}
            style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 4, color: "rgba(255,255,255,0.5)", fontSize: 11,
              padding: "3px 10px", cursor: "pointer", opacity: keyframes.length === 0 ? 0.3 : 1,
            }}
          >
            undo (⌘Z)
          </button>
          <button
            onClick={e => { e.stopPropagation(); setKeyframes([]); }}
            disabled={keyframes.length === 0}
            style={{
              background: "transparent", border: "1px solid rgba(255,60,60,0.2)",
              borderRadius: 4, color: "rgba(255,90,90,0.6)", fontSize: 11,
              padding: "3px 10px", cursor: "pointer", opacity: keyframes.length === 0 ? 0.3 : 1,
            }}
          >
            clear all
          </button>
          <button
            onClick={e => { e.stopPropagation(); doCopy(); }}
            disabled={sortedKfs.length < 2}
            style={{
              background: copied ? "rgba(80,220,120,0.12)" : "rgba(100,190,255,0.08)",
              border: `1px solid ${copied ? "rgba(80,220,120,0.35)" : "rgba(100,190,255,0.22)"}`,
              borderRadius: 4,
              color: copied ? "rgba(80,220,120,0.9)" : "rgba(100,190,255,0.85)",
              fontSize: 11, padding: "3px 12px", cursor: "pointer",
              opacity: sortedKfs.length < 2 ? 0.3 : 1,
            }}
          >
            {copied ? "✓ copied!" : "copy path  (Enter)"}
          </button>

          <div style={{ flex: 1 }} />

          {/* keyframe pills */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "60%" }}>
            {sortedKfs.map((kf, i) => (
              <div
                key={i}
                onClick={e => {
                  e.stopPropagation();
                  if (videoRef.current && videoDur > 0) {
                    videoRef.current.currentTime = kf.t * videoDur;
                    setVideoT(kf.t * videoDur);
                  }
                }}
                title={`x=${kf.x.toFixed(3)} y=${kf.y.toFixed(3)}`}
                style={{
                  background: "rgba(255,200,100,0.07)",
                  border: `1px solid ${Math.abs(kf.t - videoProgress) < 0.015
                    ? "rgba(255,200,100,0.7)"
                    : "rgba(255,200,100,0.18)"}`,
                  borderRadius: 4, padding: "2px 7px", fontSize: 10,
                  color: "rgba(255,200,100,0.8)", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                {kf.t.toFixed(2)}
                <span
                  onClick={e2 => {
                    e2.stopPropagation();
                    setKeyframes(prev => prev.filter(k => Math.abs(k.t - kf.t) > 0.001));
                  }}
                  style={{ color: "rgba(255,80,80,0.5)", cursor: "pointer" }}
                >×</span>
              </div>
            ))}
          </div>
        </div>

        {/* hint */}
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.16)", lineHeight: 1.6 }}>
          <strong style={{ color: "rgba(255,255,255,0.3)" }}>Workflow:</strong>&nbsp;
          Scrub to a video frame → click where butterfly should be at that moment → repeat across the timeline → Enter to copy →
          paste as <code>path</code> prop &nbsp;·&nbsp; click a pill to jump to that frame &nbsp;·&nbsp; Space = play/pause
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function HeroButterflyCanvas({
  progressRef,
  path = CUSTOM_BUTTERFLY_PATH,
  showPath = false,
  showPathPoints = false,
  editorMode = false,
  editorVideoSrc,
}: HeroButterflyCanvasProps) {
  preload(sittingFrameSrc(FIRST_SITTING_FRAME), { as: "image" });

  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const ctxRef        = useRef<CanvasRenderingContext2D | null>(null);
  const sittingFrames = useRef<HTMLImageElement[]>([]);
  const takeoffFrames = useRef<HTMLImageElement[]>([]);
  const flyingFrames  = useRef<HTMLImageElement[]>([]);
  const sittingIndex  = useRef(0);
  const wingPhase     = useRef(0);
  const facingLeftRef = useRef(true);
  const directionFlipRef = useRef<{
    active: boolean;
    phase: "reverseTakeoff" | "forwardTakeoff";
    phaseT: number;
    fromFacingLeft: boolean;
    toFacingLeft: boolean;
  }>({
    active: false,
    phase: "reverseTakeoff",
    phaseT: 0,
    fromFacingLeft: true,
    toFacingLeft: true,
  });
  const readyRef      = useRef(false);
  const pathRef       = useRef<PathKeyframe[]>(path);
  const [editorDismissed, setEditorDismissed] = useState(false);
  const editorOpen = editorMode && !editorDismissed;

  useEffect(() => { pathRef.current = path; }, [path]);

  // image loading
  useEffect(() => {
    let cancelled = false;
    let cancelIdle = () => {};
    const loadRest = async () => {
      const takeoffFrameNumbers = Array.from({ length: TAKEOFF_FRAME_COUNT }, (_, i) => i + 1)
        .filter((frameNumber, idx) => idx % TAKEOFF_FRAME_STRIDE === 0 || frameNumber === TAKEOFF_FRAME_COUNT);
      const [take, fly, sitRest] = await Promise.all([
        Promise.all(takeoffFrameNumbers.map((frameNumber) => loadImage(takeoffFrameSrc(frameNumber)))),
        Promise.all(Array.from({ length: FLYING_FRAME_COUNT  }, (_, i) => loadImage(flyingFrameSrc(i + 1)))),
        Promise.all(Array.from({ length: SITTING_FRAME_COUNT - FIRST_SITTING_FRAME }, (_, i) =>
          loadImage(sittingFrameSrc(FIRST_SITTING_FRAME + i + 1)))),
      ]);
      if (cancelled) return;
      sittingFrames.current = [...sittingFrames.current, ...sitRest];
      takeoffFrames.current = take;
      flyingFrames.current  = fly;
    };
    const loadCritical = async () => {
      const first = await loadImage(sittingFrameSrc(FIRST_SITTING_FRAME));
      if (cancelled) return;
      sittingFrames.current = [first];
      readyRef.current      = true;
      cancelIdle = whenBrowserIsIdle(() => void loadRest());
    };
    void loadCritical();
    return () => { cancelled = true; cancelIdle(); };
  }, []);

  const drawFrame = useCallback(
    (img: HTMLImageElement, pos: { x: number; y: number }, flipX: boolean, pathKeyframes: PathKeyframe[], progress: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      let ctx = ctxRef.current;
      if (!ctx) {
        ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctxRef.current = ctx;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (showPath || showPathPoints) {
        drawPathGuide(ctx, canvas, pathKeyframes, progress, {
          showLine: showPath,
          showPoints: showPath || showPathPoints,
        });
      }
      const size    = isMobile() ? MOBILE_BUTTERFLY_SIZE : BUTTERFLY_SIZE;
      ctx.save();
      ctx.translate(pos.x * canvas.width, pos.y * canvas.height);
      if (flipX) ctx.scale(-1, 1);
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    },
    [showPath, showPathPoints],
  );

  useEffect(() => {
    let animFrame = 0;
    let stableW = window.innerWidth;
    let stableH = window.innerHeight;
    let lastProgress = progressRef.current;
    let lastTime = 0;

    const applySize = () => {
      const c = canvasRef.current;
      if (!c) return;
      c.width = stableW; c.height = stableH;
    };

    const onResize = () => {
      const nw = window.innerWidth, nh = window.innerHeight;
      if (nw !== stableW || Math.abs(nh - stableH) > 100) {
        stableW = nw; stableH = nh; applySize();
      }
    };

    const tick = (time: number) => {
      animFrame = requestAnimationFrame(tick);
      if (!readyRef.current) return;

      const dt = lastTime > 0 ? Math.min((time - lastTime) / 1000, 0.05) : 0;
      lastTime = time;

      const progress = Math.max(0, Math.min(1, progressRef.current));
      const progressDelta = progress - lastProgress;
      lastProgress = progress;
      const scrollMotion = Math.abs(progressDelta);

      const sitFrames = sittingFrames.current;
      const takeFrames = takeoffFrames.current;
      const flyFrames = flyingFrames.current;
      const fallback  = sitFrames[0];
      if (!fallback) return;

      const kfs = pathRef.current;
      const pos = lerpPath(kfs, progress);

      const dx = pathHorizontalDelta(kfs, progress);
      const hasDirectionalSignal = Math.abs(dx) > FLIP_DIRECTION_THRESHOLD;
      const desiredFacingLeft = hasDirectionalSignal ? dx < 0 : facingLeftRef.current;
      const flipTransition = directionFlipRef.current;

      if (progress < FLYING_START_PROGRESS) {
        flipTransition.active = false;
        sittingIndex.current += dt * SITTING_IDLE_FPS;
        if (scrollMotion > 0) {
          sittingIndex.current += scrollMotion * SITTING_SCROLL_SCALE;
        }
        const flipX = desiredFacingLeft;
        facingLeftRef.current = flipX;
        drawFrame(sitFrames[Math.floor(sittingIndex.current) % sitFrames.length], pos, flipX, kfs, progress);
        return;
      }
      const poseStage = getPoseStage(progress);
      if (poseStage === "takeoffIn" || poseStage === "takeoffOut") {
        flipTransition.active = false;
        if (takeFrames.length > 0) {
          const reverse = poseStage === "takeoffIn";
          const frameIndex = getTakeoffTransitionFrameIndex(progress, reverse, takeFrames.length);
          const flipX = desiredFacingLeft;
          facingLeftRef.current = flipX;
          drawFrame(takeFrames[frameIndex], pos, flipX, kfs, progress);
          return;
        }
        // If takeoff frames are not ready yet, fall back to sitting pose.
      }
      if (poseStage === "sitting") {
        flipTransition.active = false;
        sittingIndex.current += dt * SITTING_IDLE_FPS;
        if (scrollMotion > 0) {
          sittingIndex.current += scrollMotion * SITTING_SCROLL_SCALE;
        }
        const flipX = desiredFacingLeft;
        facingLeftRef.current = flipX;
        drawFrame(sitFrames[Math.floor(sittingIndex.current) % sitFrames.length], pos, flipX, kfs, progress);
        return;
      }
      // Flying stage: smooth direction change with takeoff transition when idle/slow.
      if (flipTransition.active && takeFrames.length > 0) {
        if (scrollMotion > FAST_SCROLL_FLIP_SKIP) {
          flipTransition.active = false;
          facingLeftRef.current = desiredFacingLeft;
        } else {
          flipTransition.phaseT = Math.min(
            1,
            flipTransition.phaseT + dt / DIRECTION_FLIP_PHASE_SECONDS,
          );
          if (flipTransition.phase === "reverseTakeoff") {
            const idx = getTakeoffFrameIndexByPhaseT(flipTransition.phaseT, true, takeFrames.length);
            drawFrame(takeFrames[idx], pos, flipTransition.fromFacingLeft, kfs, progress);
            if (flipTransition.phaseT >= 1) {
              flipTransition.phase = "forwardTakeoff";
              flipTransition.phaseT = 0;
              facingLeftRef.current = flipTransition.toFacingLeft;
            }
            return;
          }
          const idx = getTakeoffFrameIndexByPhaseT(flipTransition.phaseT, false, takeFrames.length);
          drawFrame(takeFrames[idx], pos, flipTransition.toFacingLeft, kfs, progress);
          if (flipTransition.phaseT >= 1) {
            flipTransition.active = false;
            facingLeftRef.current = flipTransition.toFacingLeft;
          }
          return;
        }
      }

      if (
        desiredFacingLeft !== facingLeftRef.current &&
        takeFrames.length > 0 &&
        scrollMotion <= FAST_SCROLL_FLIP_SKIP
      ) {
        flipTransition.active = true;
        flipTransition.phase = "reverseTakeoff";
        flipTransition.phaseT = 0;
        flipTransition.fromFacingLeft = facingLeftRef.current;
        flipTransition.toFacingLeft = desiredFacingLeft;
      } else {
        facingLeftRef.current = desiredFacingLeft;
      }

      const flipX = facingLeftRef.current;
      if (flyFrames.length === 0) { drawFrame(fallback, pos, flipX, kfs, progress); return; }

      wingPhase.current += dt * IDLE_WING_FPS;
      if (scrollMotion > 0) {
        wingPhase.current += scrollMotion * FLYING_WING_SCALE;
      }
      const frameIndex = Math.floor(wingPhase.current) % flyFrames.length;
      drawFrame(flyFrames[frameIndex], pos, flipX, kfs, progress);
    };

    applySize();
    window.addEventListener("resize", onResize);
    animFrame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(animFrame); window.removeEventListener("resize", onResize); };
  }, [drawFrame, progressRef]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />
      {editorOpen && (
        <PathEditorOverlay
          videoSrc={editorVideoSrc}
          onClose={() => setEditorDismissed(true)}
        />
      )}
    </>
  );
}