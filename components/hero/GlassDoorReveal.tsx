"use client";

import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type GlassDoorRevealProps = {
  id?: string;
  src: string;
  heading?: ReactNode;
  variant?: "swing" | "slide";
  /**
   * Controls the TOTAL scroll distance of the section.
   * = viewport-heights of scroll per 1.0 unit of timeline.
   * Bigger = the whole hero takes more scrolling (slower / longer).
   */
  scrollLength?: number;
  showCue?: boolean;
  className?: string;

  /** When the doors BEGIN opening (in units). */
  doorStartProgress?: number;
  /** How long the doors take to fully open (in units). */
  doorScrollDistance?: number;
  /** When the video BEGINS playing (in units). */
  videoStartProgress?: number;
  /** How long the video takes to fully play (in units). */
  videoScrollDistance?: number;
  /** Extra dead-scroll AFTER everything is done, before the section releases (in units). */
  holdAfter?: number;
};

const SEAM = "rgba(255,236,214,0.30)";
const FROST = "rgba(244,247,251,0.10)";
const SWING_ANGLE = 118;

export default function GlassDoorReveal({
  id,
  src,
  heading,
  variant = "swing",
  scrollLength = 3,
  showCue = true,
  className,
  doorStartProgress = 0,
  doorScrollDistance = 1,
  videoStartProgress = 0.3,
  videoScrollDistance = 0.7,
  holdAfter = 0,
}: GlassDoorRevealProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const cueRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const targetTimeRef = useRef(0);

  // ----- AUTO-CALCULATED TOTAL SCROLL -----
  const doorEnd = doorStartProgress + doorScrollDistance;
  const videoEnd = videoStartProgress + videoScrollDistance;
  // The whole choreography is done at whichever finishes LAST.
  const completion = Math.max(doorEnd, videoEnd, 0.0001);
  // Total pinned length = everything done + optional hold.
  const totalUnits = completion + Math.max(holdAfter, 0);
  // Total scroll distance of the section, in viewport-heights.
  const totalVh = totalUnits * scrollLength * 100;

  useGSAP(
    () => {
      const root = rootRef.current;
      const pin = pinRef.current;
      const left = leftRef.current;
      const right = rightRef.current;
      const video = videoRef.current;
      if (!root || !pin || !left || !right || !video) return;

      gsap.set(left, { transformOrigin: "left center" });
      gsap.set(right, { transformOrigin: "right center" });

      // Normalize each sub-range into the 0..1 timeline space.
      const dStart = doorStartProgress / totalUnits;
      const dDur = doorScrollDistance / totalUnits;
      const vStart = videoStartProgress / totalUnits;
      const vEnd = videoEnd / totalUnits;

      let rafId = 0;
      let lastSeekTime = 0;

      const computeTargetTime = (progress: number): number => {
        if (!video.duration) return 0;
        if (progress <= vStart) return 0; // frozen on first frame
        if (progress >= vEnd) return video.duration; // frozen on last frame

        const span = vEnd - vStart || 1;
        const videoProgress = (progress - vStart) / span;
        return Math.min(Math.max(videoProgress, 0), 1) * video.duration;
      };

      const rafLoop = () => {
        rafId = window.requestAnimationFrame(rafLoop);
        if (!video.duration) return;

        const now = performance.now();
        if (now - lastSeekTime < 14) return;

        const desired = targetTimeRef.current;
        if (Math.abs(video.currentTime - desired) > 0.015) {
          video.currentTime = desired;
          lastSeekTime = now;
        }
      };

      rafId = window.requestAnimationFrame(rafLoop);

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          // Pin distance = the full auto-calculated scroll length.
          // pinSpacing reserves EXACTLY this much, so nothing below the hero
          // can move until the pin releases (= door AND video both done).
          end: `+=${totalVh}%`,
          pin: pin,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            targetTimeRef.current = computeTargetTime(self.progress);
          },
        },
      });

      // Lock the timeline length to exactly 1.0 so nothing gets re-stretched.
      tl.to({}, { duration: 1 }, 0);

      if (variant === "swing") {
        tl.to(left, { rotateY: -SWING_ANGLE, duration: dDur }, dStart).to(
          right,
          { rotateY: SWING_ANGLE, duration: dDur },
          dStart,
        );
      } else {
        tl.to(left, { xPercent: -100, duration: dDur }, dStart).to(
          right,
          { xPercent: 100, duration: dDur },
          dStart,
        );
      }

      tl.to([left, right], { opacity: 0.88, duration: dDur }, dStart);

      if (textRef.current) {
        tl.to(textRef.current, { autoAlpha: 0, duration: dDur * 0.2 }, dStart);
      }
      if (cueRef.current) {
        tl.to(cueRef.current, { autoAlpha: 0, duration: dDur * 0.06 }, dStart);
      }

      return () => {
        window.cancelAnimationFrame(rafId);
      };
    },
    {
      scope: rootRef,
      dependencies: [
        variant,
        scrollLength,
        doorStartProgress,
        doorScrollDistance,
        videoStartProgress,
        videoScrollDistance,
        holdAfter,
        totalUnits,
        totalVh,
      ],
    },
  );

  const doorBase: CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "50%",
    background: FROST,
    WebkitBackdropFilter: "blur(16px) saturate(118%) brightness(1.02)",
    backdropFilter: "blur(16px) saturate(118%) brightness(1.02)",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    willChange: "transform, opacity",
  };

  return (
    <section
      id={id}
      ref={rootRef}
      className={className}
      // IMPORTANT: do NOT set an explicit height here.
      // pinSpacing reserves the scroll distance automatically; setting a fixed
      // height as well double-counts the space and lets the next section ride
      // up over the hero before the animation finishes.
      style={{
        position: "relative",
        zIndex: 0,
      }}
    >
      <div
        ref={pinRef}
        style={{
          position: "relative",
          height: "100vh",
          overflow: "hidden",
          backgroundColor: "transparent",
          zIndex: 0,
        }}
      >
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            perspective: "1700px",
            transformStyle: "preserve-3d",
            pointerEvents: "none",
          }}
        >
          <div
            ref={leftRef}
            style={{
              ...doorBase,
              left: 0,
              borderRight: `0.5px solid ${SEAM}`,
              transformStyle: "preserve-3d",
            }}
          />
          <div
            ref={rightRef}
            style={{
              ...doorBase,
              right: 0,
              borderLeft: `0.5px solid ${SEAM}`,
              transformStyle: "preserve-3d",
            }}
          />
        </div>

        {heading != null && (
          <div
            ref={textRef}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "0 24px",
              pointerEvents: "none",
              color: "#ffffff",
            }}
          >
            {heading}
          </div>
        )}

        {showCue && (
          <div
            ref={cueRef}
            style={{
              position: "absolute",
              left: "50%",
              bottom: 24,
              transform: "translateX(-50%)",
              zIndex: 5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              color: "#ffffff",
            }}
          >
            <p>scroll to open</p>
            <span aria-hidden="true">&#8595;</span>
          </div>
        )}
      </div>
    </section>
  );
}