"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";

import { generateBoatWaveField } from "@/lib/boatWaveField";
import {
  buildPathExportCode,
  buildSmoothPathD,
  getSectionEnterExitProgress,
  samplePathAtProgressLinear,
  type PathKeyframe,
} from "@/lib/scrollPath";

import TransparentLoopVideo from "./TransparentLoopVideo";

const CONE_LEN = 920;
const CONE_ANGLE = 20;
const CONE_EDGE = 14;
const WAKE_STILL_MS = 130;
const WAKE_MOVE_THRESHOLD = 0.00015;
const WAKE_FADE_IN_RATE = 0.22;
const WAKE_FADE_OUT_RATE = 0.09;
const WAKE_MIN_LENGTH = 0.22;
const WAKE_MAX_SCROLL_SPEED = 0.006;
const WAKE_LENGTH_SMOOTHING = 0.14;
const WAKE_MIN_ANGLE_SCALE = 0.62;
const WAKE_MIN_FADE_START = 0.36;
const WAKE_MAX_FADE_START = 0.9;
const WAKE_MIN_BRIGHTNESS = 0.62;
const WAKE_MAX_BRIGHTNESS = 1.38;
const WAKE_WAVE_SCALE_X = 1.55;
const WAKE_WAVE_SCALE_Y = 1.42;
const SPOTLIGHT_ANCHOR_FROM_RIGHT = 0.48;
const WAKE_WATERLINE_OFFSET = 0.12;
const WAKE_MIN_REACH_BOAT_FACTOR = 0.48;
const WAKE_MIN_REACH_PX = 72;
const WAKE_BOTTOM_BLEED_PX =
  Math.ceil(
    (CONE_LEN * Math.tan(((CONE_ANGLE / 2) * Math.PI) / 180) + 56) /
      (2 - WAKE_WAVE_SCALE_Y),
  ) + 120;

/** Reserved space below the section so the wake can paint without being clipped. */
export const BOAT_WAKE_BOTTOM_BLEED_PX = WAKE_BOTTOM_BLEED_PX;
const WAKE_SIDE_BLEED_PX =
  Math.ceil(CONE_LEN * Math.tan(((CONE_ANGLE / 2) * Math.PI) / 180)) + 64;

// const MINI_BOAT_HEIGHT = "17vh";
// const MINI_PROGRESS_LAG = 0.09;
// const MINI_SMOOTHING = 0.028;
// const MINI_WAKE_SCALE = 0.58;
// const MINI_WAVE_FIELD_SCALE = 0.62;

type WakeAnimState = {
  wakePower: number;
  wakeLength: number;
  wakeTargetPower: number;
  wakeStillTimer: ReturnType<typeof setTimeout> | null;
  lastPaintKey?: string;
};

function computeWakeBleed(
  pathKeyframes: PathKeyframe[],
  sectionW: number,
  boatW: number,
) {
  const sternInset = boatW * (0.5 - SPOTLIGHT_ANCHOR_FROM_RIGHT);
  const xs = pathKeyframes.map((k) => k.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const left = Math.ceil(
    Math.max(WAKE_SIDE_BLEED_PX, -minX * sectionW + sternInset + WAKE_SIDE_BLEED_PX),
  );
  const right = Math.ceil(
    Math.max(
      WAKE_SIDE_BLEED_PX,
      maxX * sectionW + sternInset - sectionW + WAKE_SIDE_BLEED_PX,
    ),
  );
  return { left, right };
}

function mergeWakeBleed(
  paths: PathKeyframe[][],
  sectionW: number,
  boatWs: number[],
) {
  return paths.reduce(
    (acc, path, i) => {
      const bleed = computeWakeBleed(path, sectionW, boatWs[i] ?? 280);
      return {
        left: Math.max(acc.left, bleed.left),
        right: Math.max(acc.right, bleed.right),
      };
    },
    { left: WAKE_SIDE_BLEED_PX, right: WAKE_SIDE_BLEED_PX },
  );
}

function getBoatWakeAnchor(
  boatOuter: HTMLElement,
  revealEl: HTMLElement,
  revealRect?: DOMRect,
) {
  const boatW = boatOuter.offsetWidth;
  const boatH = boatOuter.offsetHeight;
  if (!boatW || !boatH) return null;

  const boatRect = boatOuter.getBoundingClientRect();
  const reveal = revealRect ?? revealEl.getBoundingClientRect();
  return {
    x: boatRect.right - boatRect.width * SPOTLIGHT_ANCHOR_FROM_RIGHT - reveal.left,
    y: boatRect.top + boatH / 2 + boatH * WAKE_WATERLINE_OFFSET - reveal.top,
    boatW,
  };
}

function applyTrim(
  sternEl: HTMLDivElement,
  bowEl: HTMLDivElement,
  trim: number,
) {
  const bowScaleY = 1 + trim * 0.22;
  const sternScaleY = 1 - trim * 0.17;
  bowEl.style.transformOrigin = "0% 50%";
  bowEl.style.transform = `scaleY(${bowScaleY})`;
  sternEl.style.transformOrigin = "100% 50%";
  sternEl.style.transform = `scaleY(${sternScaleY})`;
}

function applyWakeFrame(
  reveal: HTMLDivElement,
  wavesSvg: SVGSVGElement | null,
  anchor: { x: number; y: number; boatW: number } | null,
  speed: number,
  state: WakeAnimState,
  offScreen: boolean,
  wakeScale = 1,
) {
  if (offScreen) {
    reveal.style.opacity = "0";
    reveal.style.filter = "";
    if (wavesSvg) wavesSvg.style.transform = "";
    return;
  }

  if (!anchor) return;

  const { x, y, boatW } = anchor;
  const moving = speed > WAKE_MOVE_THRESHOLD;

  if (moving) {
    state.wakeTargetPower = 1;
    if (state.wakeStillTimer) {
      clearTimeout(state.wakeStillTimer);
      state.wakeStillTimer = null;
    }
  } else if (!state.wakeStillTimer) {
    state.wakeStillTimer = setTimeout(() => {
      state.wakeTargetPower = 0;
      state.wakeStillTimer = null;
    }, WAKE_STILL_MS);
  }

  const wakeRate =
    state.wakeTargetPower > state.wakePower ? WAKE_FADE_IN_RATE : WAKE_FADE_OUT_RATE;
  state.wakePower += (state.wakeTargetPower - state.wakePower) * wakeRate;

  const speedT = Math.min(1, speed / (WAKE_MAX_SCROLL_SPEED * wakeScale));
  const targetLength = moving ? WAKE_MIN_LENGTH + (1 - WAKE_MIN_LENGTH) * speedT : 0;
  const lengthRate = moving ? WAKE_LENGTH_SMOOTHING : WAKE_FADE_OUT_RATE;
  state.wakeLength += (targetLength - state.wakeLength) * lengthRate;

  const intensity =
    state.wakeLength <= WAKE_MIN_LENGTH
      ? 0
      : Math.min(1, (state.wakeLength - WAKE_MIN_LENGTH) / (1 - WAKE_MIN_LENGTH));

  if (state.wakePower < 0.02 && intensity < 0.02 && !moving) {
    if (reveal.style.opacity !== "0") {
      reveal.style.opacity = "0";
      reveal.style.filter = "";
      if (wavesSvg) wavesSvg.style.transform = "";
    }
    state.lastPaintKey = undefined;
    return;
  }

  const angleScale = WAKE_MIN_ANGLE_SCALE + (1 - WAKE_MIN_ANGLE_SCALE) * intensity;
  const aim = 90;
  const half = ((CONE_ANGLE / 2) * angleScale * wakeScale);
  const edge = CONE_EDGE * angleScale * wakeScale;
  const minReach = Math.max(WAKE_MIN_REACH_PX * wakeScale, boatW * WAKE_MIN_REACH_BOAT_FACTOR);
  const reach = Math.max(
    minReach * state.wakePower,
    CONE_LEN * wakeScale * state.wakePower * state.wakeLength,
  );

  const fadeStart =
    WAKE_MIN_FADE_START + (WAKE_MAX_FADE_START - WAKE_MIN_FADE_START) * intensity;
  const paintKey = [
    Math.round(x),
    Math.round(y),
    Math.round(reach),
    fadeStart.toFixed(2),
    intensity.toFixed(2),
    state.wakePower.toFixed(2),
  ].join("|");

  if (paintKey !== state.lastPaintKey) {
    state.lastPaintKey = paintKey;
    const wedge = `conic-gradient(from 0deg at ${x}px ${y}px,
    transparent ${aim - half - edge}deg,
    black ${aim - half}deg,
    black ${aim + half}deg,
    transparent ${aim + half + edge}deg,
    transparent 360deg)`;
    const reachMask = `radial-gradient(${reach}px at ${x}px ${y}px,
    black 0%, black ${(fadeStart * 100).toFixed(1)}%, transparent 100%)`;
    const mask = `${wedge}, ${reachMask}`;

    reveal.style.maskImage = mask;
    reveal.style.webkitMaskImage = mask;
    reveal.style.maskRepeat = "no-repeat";
    reveal.style.webkitMaskRepeat = "no-repeat";
    reveal.style.maskComposite = "intersect";
    reveal.style.webkitMaskComposite = "source-in";
  }

  const brightness =
    WAKE_MIN_BRIGHTNESS + (WAKE_MAX_BRIGHTNESS - WAKE_MIN_BRIGHTNESS) * intensity;
  const nextOpacity = state.wakePower < 0.02 ? "0" : String(0.5 + 0.5 * intensity);
  const nextFilter = `brightness(${brightness.toFixed(3)})`;
  if (reveal.style.filter !== nextFilter) reveal.style.filter = nextFilter;
  if (reveal.style.opacity !== nextOpacity) reveal.style.opacity = nextOpacity;

  if (wavesSvg) {
    const waveBoostX = 1 + (WAKE_WAVE_SCALE_X - 1) * intensity * wakeScale;
    const waveBoostY = 1 + (WAKE_WAVE_SCALE_Y - 1) * intensity * wakeScale;
    const nextTransform = `translate(${x}px, ${y}px) scale(${waveBoostX.toFixed(3)}, ${waveBoostY.toFixed(3)}) translate(${-x}px, ${-y}px)`;
    if (wavesSvg.style.transform !== nextTransform) {
      wavesSvg.style.transformOrigin = "0 0";
      wavesSvg.style.transform = nextTransform;
    }
  }
}

/** Default sail path — horizontal travel only; fleet is anchored to section bottom. */
export const BOAT_PATH: PathKeyframe[] = [
  { t: 0.0, x: 1.12, y: 1 },
  { t: 0.5, x: 0.5, y: 1 },
  { t: 1.0, x: -0.55, y: 1 },
];

// export const MINI_BOAT_PATH = BOAT_PATH;

function BoatHull({
  src,
  height,
  className = "",
  sternRef,
  bowRef,
  playing,
}: {
  src: string;
  height: string;
  className?: string;
  sternRef: RefObject<HTMLDivElement | null>;
  bowRef: RefObject<HTMLDivElement | null>;
  playing?: boolean;
}) {
  return (
    <div className={`relative block shrink-0 leading-none ${className}`}>
      <div ref={sternRef} style={{ transformOrigin: "100% 50%", willChange: "transform" }}>
        <div ref={bowRef} style={{ transformOrigin: "0% 50%", willChange: "transform" }}>
          <TransparentLoopVideo
            src={src}
            height={height}
            className="pointer-events-none block"
            playing={playing}
          />
        </div>
      </div>
    </div>
  );
}

function setWakeAnimations(reveal: HTMLDivElement | null, running: boolean) {
  if (!reveal) return;
  reveal.querySelectorAll<HTMLElement>(".boat-wave-flow").forEach((el) => {
    el.style.animationPlayState = running ? "running" : "paused";
  });
}

function WakeLayer({
  revealRef,
  wavesSvgRef,
  wakeBleed,
  zIndex,
  waveFieldScale = 1,
}: {
  revealRef: RefObject<HTMLDivElement | null>;
  wavesSvgRef: RefObject<SVGSVGElement | null>;
  wakeBleed: { left: number; right: number };
  zIndex: number;
  waveFieldScale?: number;
}) {
  useEffect(() => {
    const reveal = revealRef.current;
    const svg = wavesSvgRef.current;
    if (!reveal || !svg) return;

    let resizeTimer: ReturnType<typeof setTimeout>;
    const generate = () => generateBoatWaveField(svg, { scale: waveFieldScale });

    generate();
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(generate, 200);
    });
    ro.observe(reveal);

    return () => {
      ro.disconnect();
      clearTimeout(resizeTimer);
    };
  }, [revealRef, wavesSvgRef, waveFieldScale]);

  return (
    <div
      ref={revealRef}
      className="pointer-events-none absolute top-0 overflow-visible"
      style={
        {
          left: -wakeBleed.left,
          right: -wakeBleed.right,
          bottom: -WAKE_BOTTOM_BLEED_PX,
          zIndex,
          willChange: "transform",
          "--trace": "255, 255, 255",
        } as CSSProperties
      }
      aria-hidden
    >
      <svg
        ref={wavesSvgRef}
        className="absolute inset-0 block h-full w-full overflow-visible"
        shapeRendering="geometricPrecision"
        style={{ willChange: "transform", overflow: "visible" }}
        overflow="visible"
        aria-hidden
      />
    </div>
  );
}

type FleetProps = {
  src: string;
  mainHeight: string;
  className?: string;
  path: PathKeyframe[];
  editorMode?: boolean;
  showPath?: boolean;
  editorKeyframes?: PathKeyframe[];
  scrollProgress?: number;
  onScrollProgressChange?: (progress: number) => void;
};

function BoatFleet({
  src,
  mainHeight,
  className = "",
  path,
  editorMode = false,
  showPath = false,
  editorKeyframes,
  scrollProgress = 0,
  onScrollProgressChange,
}: FleetProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  // const miniOffsetRef = useRef<HTMLDivElement>(null);
  const mainHullRef = useRef<HTMLDivElement>(null);
  const mainSternRef = useRef<HTMLDivElement>(null);
  const mainBowRef = useRef<HTMLDivElement>(null);
  // const miniSternRef = useRef<HTMLDivElement>(null);
  // const miniBowRef = useRef<HTMLDivElement>(null);
  const mainRevealRef = useRef<HTMLDivElement>(null);
  // const miniRevealRef = useRef<HTMLDivElement>(null);
  const mainWavesRef = useRef<SVGSVGElement>(null);
  // const miniWavesRef = useRef<SVGSVGElement>(null);
  const progressRef = useRef(0);

  const [guideSize, setGuideSize] = useState({ w: 0, h: 0 });
  const [wakeBleed, setWakeBleed] = useState({ left: WAKE_SIDE_BLEED_PX, right: WAKE_SIDE_BLEED_PX });
  const [videosPlaying, setVideosPlaying] = useState(false);
  const sectionActiveRef = useRef(false);

  const activePath = editorMode && editorKeyframes ? editorKeyframes : path;

  const applyGroupPosition = useCallback(
    (mainProgress: number /*, miniProgress: number */) => {
      const group = groupRef.current;
      // const miniOffset = miniOffsetRef.current;
      const section = sectionRef.current;
      if (!group || !section) return;

      const w = section.clientWidth;
      const mainX = samplePathAtProgressLinear(activePath, mainProgress).x;
      // const miniX = samplePathAtProgressLinear(activePath, miniProgress).x;
      group.style.transform = `translate3d(calc(${mainX * w}px - 50%), 0, 0)`;
      // if (miniOffset) {
      //   miniOffset.style.transform = `translate3d(${(miniX - mainX) * w}px, 0, 0)`;
      // }
    },
    [activePath],
  );

  useEffect(() => {
    const group = groupRef.current;
    const section = sectionRef.current ?? group?.closest("section");
    if (!section) return;
    sectionRef.current = section;

    const syncLayout = () => {
      const mainW = mainHullRef.current?.offsetWidth ?? 280;
      // const miniW = miniOffsetRef.current?.offsetWidth ?? 170;
      setWakeBleed(
        mergeWakeBleed([activePath], section.clientWidth, [mainW]),
        // mergeWakeBleed([activePath, activePath], section.clientWidth, [mainW, miniW]),
      );
    };

    syncLayout();
    const ro = new ResizeObserver(syncLayout);
    ro.observe(section);
    if (mainHullRef.current) ro.observe(mainHullRef.current);
    // if (miniOffsetRef.current) ro.observe(miniOffsetRef.current);
    return () => ro.disconnect();
  }, [activePath]);

  useEffect(() => {
    const group = groupRef.current;
    const section = sectionRef.current ?? group?.closest("section");
    if (!group || !section) return;
    sectionRef.current = section;

    const isSectionFullyOffScreen = () => {
      const rect = section.getBoundingClientRect();
      return rect.bottom <= 0 || rect.top >= window.innerHeight;
    };

    let target = 0;
    let current = 0;
    // let miniCurrent = 0;
    let travel = 0;
    let anchorRaw = 0;
    let lastTravelFloor = 0;
    let lastCurrent = 0;
    // let lastMiniCurrent = 0;
    let lastVelocity = 0;
    // let lastMiniVelocity = 0;
    let trim = 0;
    // let miniTrim = 0;
    let raf = 0;
    let lastStateValue = -1;
    let lastFrameTs = 0;
    let running = true;

    const mainWake: WakeAnimState = {
      wakePower: 0,
      wakeLength: 0,
      wakeTargetPower: 0,
      wakeStillTimer: null,
    };
    // const miniWake: WakeAnimState = {
    //   wakePower: 0,
    //   wakeLength: 0,
    //   wakeTargetPower: 0,
    //   wakeStillTimer: null,
    // };

    const scheduleTick = () => {
      if (raf || !running) return;
      raf = requestAnimationFrame(tick);
    };

    const setSectionActive = (active: boolean) => {
      sectionActiveRef.current = active;
      const animationsEnabled = editorMode || active;
      setVideosPlaying(animationsEnabled);
      setWakeAnimations(mainRevealRef.current, animationsEnabled);
      // setWakeAnimations(miniRevealRef.current, animationsEnabled);
      if (animationsEnabled) scheduleTick();
    };

    const observer = new IntersectionObserver(
      ([entry]) => setSectionActive(entry.isIntersecting),
      { rootMargin: "160px 0px", threshold: 0 },
    );
    observer.observe(section);

    const onScroll = () => {
      if (editorMode || sectionActiveRef.current) scheduleTick();
    };
    const onResize = () => scheduleTick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    const resetWake = (state: WakeAnimState) => {
      state.wakeTargetPower = 0;
      state.wakePower = 0;
      state.wakeLength = 0;
      state.lastPaintKey = undefined;
      if (state.wakeStillTimer) {
        clearTimeout(state.wakeStillTimer);
        state.wakeStillTimer = null;
      }
    };

    const readTarget = () => {
      const raw = getSectionEnterExitProgress(section);
      if (isSectionFullyOffScreen()) {
        travel = 0;
        anchorRaw = 0;
        lastTravelFloor = 0;
        current = 0;
        lastCurrent = 0;
        // miniCurrent = 0;
        // lastMiniCurrent = 0;
        lastVelocity = 0;
        // lastMiniVelocity = 0;
        trim = 0;
        // miniTrim = 0;
        resetWake(mainWake);
        // resetWake(miniWake);
        return 0;
      }

      if (raw !== anchorRaw) {
        travel += Math.abs(raw - anchorRaw);
        anchorRaw = raw;
      }

      return travel % 1;
    };

    target = readTarget();
    current = target;
    // miniCurrent = Math.max(0, target - MINI_PROGRESS_LAG);
    lastCurrent = current;
    // lastMiniCurrent = miniCurrent;

    const SMOOTHING = 0.055;
    const EASE_OUT_BOOST = 2.2;
    const CRUISE_TRIM = 0.42;
    const CRUISE_SPEED = 0.006;
    const TRIM_SMOOTHING = 0.07;
    const VELOCITY_SMOOTHING = 0.14;

    const advanceProgress = (
      progress: number,
      progressTarget: number,
      smoothing: number,
      wrappedLap: boolean,
    ) => {
      if (wrappedLap) return progressTarget;
      const gap = progressTarget - progress;
      const dist = Math.abs(gap);
      const alpha = Math.min(1, smoothing * (1 + EASE_OUT_BOOST * (1 - (1 - dist) ** 2)));
      let next = progress + gap * alpha;
      if (Math.abs(progressTarget - next) < 0.0002) next = progressTarget;
      return next;
    };

    const sampleVelocity = (
      prev: number,
      next: number,
      lastSmoothed: number,
    ) => {
      let velocity = next - prev;
      if (velocity < -0.5) velocity += 1;
      if (velocity > 0.5) velocity -= 1;
      return {
        velocity,
        smoothed: lastSmoothed + (velocity - lastSmoothed) * VELOCITY_SMOOTHING,
      };
    };

    const sampleTrim = (smoothedVelocity: number, lastSmoothed: number, currentTrim: number) => {
      const speed = Math.abs(smoothedVelocity);
      const acceleration = smoothedVelocity - lastSmoothed;
      const cruiseTrim =
        speed > 0.00015 ? CRUISE_TRIM * Math.min(speed / CRUISE_SPEED, 1) : 0;
      const accelTrim = Math.max(-1, Math.min(1, acceleration * 9000));
      const trimTarget =
        speed > 0.00008 ? Math.max(-1, Math.min(1, accelTrim + cruiseTrim)) : 0;
      return currentTrim + (trimTarget - currentTrim) * TRIM_SMOOTHING;
    };

    const tick = () => {
      raf = 0;
      if (!running) return;
      if (!editorMode && !sectionActiveRef.current) return;

      const now = performance.now();
      if (now - lastFrameTs < 14) {
        scheduleTick();
        return;
      }
      lastFrameTs = now;

      const prevTravelFloor = lastTravelFloor;
      target = readTarget();
      lastTravelFloor = Math.floor(travel);

      const wrappedLap = lastTravelFloor > prevTravelFloor;
      if (wrappedLap) {
        current = target;
        lastCurrent = current;
        lastVelocity = 0;
        // miniCurrent = Math.max(0, target - MINI_PROGRESS_LAG);
        // lastMiniCurrent = miniCurrent;
        // lastMiniVelocity = 0;
      } else {
        current = advanceProgress(current, target, SMOOTHING, false);
        // const miniTarget = Math.max(0, current - MINI_PROGRESS_LAG);
        // miniCurrent = advanceProgress(miniCurrent, miniTarget, MINI_SMOOTHING, false);
      }

      const mainMotion = sampleVelocity(lastCurrent, current, lastVelocity);
      const prevMainVelocity = lastVelocity;
      lastCurrent = current;
      lastVelocity = mainMotion.smoothed;

      // const miniMotion = sampleVelocity(lastMiniCurrent, miniCurrent, lastMiniVelocity);
      // const prevMiniVelocity = lastMiniVelocity;
      // lastMiniCurrent = miniCurrent;
      // lastMiniVelocity = miniMotion.smoothed;

      trim = sampleTrim(mainMotion.smoothed, prevMainVelocity, trim);
      // miniTrim = sampleTrim(miniMotion.smoothed, prevMiniVelocity, miniTrim);

      if (mainSternRef.current && mainBowRef.current) {
        applyTrim(mainSternRef.current, mainBowRef.current, trim);
      }
      // if (miniSternRef.current && miniBowRef.current) {
      //   applyTrim(miniSternRef.current, miniBowRef.current, miniTrim);
      // }

      progressRef.current = current;
      applyGroupPosition(current /*, miniCurrent */);

      const offScreen = isSectionFullyOffScreen();
      const mainReveal = mainRevealRef.current;
      // const miniReveal = miniRevealRef.current;
      const mainHull = mainHullRef.current;
      // const miniHull = miniOffsetRef.current;
      const mainRevealRect = offScreen || !mainReveal ? null : mainReveal.getBoundingClientRect();

      if (mainReveal && mainHull) {
        const anchor = offScreen || !mainRevealRect
          ? null
          : getBoatWakeAnchor(mainHull, mainReveal, mainRevealRect);
        applyWakeFrame(
          mainReveal,
          mainWavesRef.current,
          anchor,
          Math.abs(mainMotion.smoothed),
          mainWake,
          offScreen,
        );
      }
      // if (miniReveal && miniHull) {
      //   const miniRevealRect = offScreen || !miniReveal ? null : miniReveal.getBoundingClientRect();
      //   const anchor = offScreen || !miniRevealRect
      //     ? null
      //     : getBoatWakeAnchor(miniHull, miniReveal, miniRevealRect);
      //   applyWakeFrame(
      //     miniReveal,
      //     miniWavesRef.current,
      //     anchor,
      //     Math.abs(miniMotion.smoothed),
      //     miniWake,
      //     offScreen,
      //     MINI_WAKE_SCALE,
      //   );
      // }

      if (onScrollProgressChange && Math.abs(current - lastStateValue) > 0.004) {
        lastStateValue = current;
        onScrollProgressChange(current);
      }

      const keepAnimating =
        editorMode ||
        Math.abs(mainMotion.smoothed) > 0.00012 ||
        // Math.abs(miniMotion.smoothed) > 0.00012 ||
        mainWake.wakePower > 0.02 ||
        // miniWake.wakePower > 0.02 ||
        mainWake.wakeLength > 0.02 ||
        // miniWake.wakeLength > 0.02 ||
        Math.abs(trim) > 0.005;
        // Math.abs(miniTrim) > 0.005;

      if (keepAnimating) scheduleTick();
    };

    scheduleTick();

    return () => {
      running = false;
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      if (mainWake.wakeStillTimer) clearTimeout(mainWake.wakeStillTimer);
      // if (miniWake.wakeStillTimer) clearTimeout(miniWake.wakeStillTimer);
    };
  }, [applyGroupPosition, editorMode, onScrollProgressChange]);

  useEffect(() => {
    applyGroupPosition(progressRef.current /*, Math.max(0, progressRef.current - MINI_PROGRESS_LAG) */);
  }, [activePath, applyGroupPosition]);

  useEffect(() => {
    if (!showPath && !editorMode) return;
    const section = sectionRef.current;
    if (!section) return;

    const sync = () => {
      setGuideSize({ w: section.clientWidth, h: section.clientHeight });
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(section);
    return () => ro.disconnect();
  }, [editorMode, showPath]);

  const fullPathD =
    (showPath || editorMode) && guideSize.w > 0
      ? buildSmoothPathD(activePath, guideSize.w, guideSize.h, 0, 1, 72, true)
      : "";
  const traveledPathD =
    (showPath || editorMode) && guideSize.w > 0 && scrollProgress > 0
      ? buildSmoothPathD(activePath, guideSize.w, guideSize.h, 0, scrollProgress, 72, true)
      : "";
  const sortedPath = [...activePath].sort((a, b) => a.t - b.t);

  return (
    <div className="pointer-events-none absolute inset-0 z-5 overflow-visible" style={{ overflow: "visible" }}>
      {/* <WakeLayer
        revealRef={miniRevealRef}
        wavesSvgRef={miniWavesRef}
        wakeBleed={wakeBleed}
        zIndex={0}
        waveFieldScale={MINI_WAVE_FIELD_SCALE}
      /> */}
      <WakeLayer
        revealRef={mainRevealRef}
        wavesSvgRef={mainWavesRef}
        wakeBleed={wakeBleed}
        zIndex={1}
      />

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
              stroke="rgba(120,200,255,0.32)"
              strokeWidth={2}
              strokeDasharray="8 6"
              strokeLinecap="round"
            />
          )}
          {traveledPathD && (
            <path
              d={traveledPathD}
              fill="none"
              stroke="rgba(80,180,255,0.78)"
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
                        : "rgba(120,200,255,0.88)"
                  }
                  stroke="rgba(255,255,255,0.55)"
                  strokeWidth={1.5}
                />
              </g>
            );
          })}
        </svg>
      )}

      <div
        ref={groupRef}
        className="pointer-events-none absolute bottom-0 left-0 z-2"
        style={{ willChange: "transform" }}
      >
        <div className="flex flex-col items-center leading-none">
          <div ref={mainHullRef}>
            <BoatHull
              src={src}
              height={mainHeight}
              className={className}
              sternRef={mainSternRef}
              bowRef={mainBowRef}
              playing={editorMode || videosPlaying}
            />
          </div>
          {/* <div ref={miniOffsetRef} style={{ willChange: "transform" }}>
            <BoatHull
              src={src}
              height={MINI_BOAT_HEIGHT}
              sternRef={miniSternRef}
              bowRef={miniBowRef}
              playing={editorMode || videosPlaying}
            />
          </div> */}
        </div>
      </div>
    </div>
  );
}

type Props = {
  src?: string;
  height?: string;
  className?: string;
  path?: PathKeyframe[];
  showPath?: boolean;
  editorMode?: boolean;
};

export default function BoatScrollReveal({
  src = "/boat.webm",
  height = "30vh",
  className = "",
  path = BOAT_PATH,
  showPath = false,
  editorMode = false,
}: Props) {
  const [editorKeyframes, setEditorKeyframes] = useState<PathKeyframe[]>(path);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const placeKeyframe = useCallback(
    (clientX: number, clientY: number) => {
      const section = document.getElementById("service-model-ops");
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

    const code = buildPathExportCode("BOAT_PATH", sorted);
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      console.log("[BoatPathEditor] Copied:\n\n" + code);
      window.setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      console.log("[BoatPathEditor] Clipboard unavailable. Code:\n\n" + code);
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

  return (
    <>
      <BoatFleet
        src={src}
        mainHeight={height}
        className={className}
        path={path}
        editorMode={editorMode}
        showPath={showPath}
        editorKeyframes={editorKeyframes}
        scrollProgress={scrollProgress}
        onScrollProgressChange={editorMode ? setScrollProgress : undefined}
      />

      {editorMode && (
        <div
          className="absolute inset-0 z-40 cursor-crosshair"
          onClick={(e) => placeKeyframe(e.clientX, e.clientY)}
        >
          <div className="pointer-events-none absolute top-4 left-1/2 z-50 -translate-x-1/2 rounded-md bg-black/75 px-4 py-2 font-mono text-xs text-sky-100">
            Scroll to set progress ({scrollProgress.toFixed(3)}) → click to place pin · Enter copy path ·
            Ctrl+Z undo
            {copied ? " · Copied!" : ""}
          </div>
          {flash && (
            <div className="pointer-events-none absolute bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md bg-sky-400 px-4 py-2 font-mono text-xs font-bold text-black">
              {flash}
            </div>
          )}
        </div>
      )}
    </>
  );
}
