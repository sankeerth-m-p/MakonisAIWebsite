"use client";

import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import HeroButterflyCanvas from "@/components/hero/HeroButterflyCanvas";

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
  /** Lower = smoother/more delayed video glide, higher = more responsive. */
  videoGlide?: number;
  /** Extra dead-scroll AFTER everything is done, before the section releases (in units). */
  holdAfter?: number;
  showButterfly?: boolean;
  showLogo?: boolean;
  logoSrc?: string;
  /** When the logo BEGINS fading out (in units). */
  logoOutStartProgress?: number;
  /** How long the logo takes to fully disappear (in units). */
  logoOutDistance?: number;
  /** Extra scroll (viewport %) the logo stays visible before fading out. */
  logoHoldBeforeOutVh?: number;
  showSmallLogo?: boolean;
  smallLogoSrc?: string;
  /** How long the small top logo takes to drop in (in units). */
  smallLogoInDistance?: number;
  showHeroPhrases?: boolean;
  heroPhrases?: HeroPhrase[];
  /** Scroll length for each bottom phrase cycle (in units). Auto-fit if omitted. */
  phraseCycleDistance?: number;
};

type HeroPhrase = {
  title: string;
  tagline: string;
};

const DEFAULT_HERO_PHRASES: HeroPhrase[] = [
  {
    title: "Custom AI/ML Development",
    tagline: "Designed for Real-World Impact",
  },
  {
    title: "Enterprise AI Integration",
    tagline: "Built for Enterprise Scale",
  },
  {
    title: "AI Strategy & Consulting",
    tagline: "Guiding Your AI Transformation",
  },
];

const SEAM = "rgba(255,236,214,0.30)";
const FROST = "rgba(244,247,251,0.10)";
const SWING_ANGLE = 118;

function applyLogoDoorMask(
  el: HTMLElement,
  leftInsetPercent: number,
  rightInsetPercent: number,
) {
  const left = Math.max(0, Math.min(100, leftInsetPercent));
  const right = Math.max(0, Math.min(100, rightInsetPercent));
  const clip = `inset(0% ${right}% 0% ${left}%)`;
  el.style.clipPath = clip;
  el.style.setProperty("-webkit-clip-path", clip);
}

function seamCenterX(el: HTMLElement): number {
  const rect = el.getBoundingClientRect();
  return rect.left + rect.width / 2;
}

export default function GlassDoorReveal({
  id,
  src,
  heading,
  variant = "swing",
  scrollLength = 3,
  showCue = false,
  className,
  doorStartProgress = 0,
  doorScrollDistance = 1,
  videoStartProgress = 0.3,
  videoScrollDistance = 1.7,
  videoGlide = 0.08,
  holdAfter = 0,
  showButterfly = true,
  showLogo = true,
  logoSrc = "/makonis_ai_logo.png",
  logoOutStartProgress,
  logoOutDistance = 0.08,
  logoHoldBeforeOutVh = 0,
  showSmallLogo = true,
  smallLogoSrc,
  smallLogoInDistance = 0.18,
  showHeroPhrases = true,
  heroPhrases = DEFAULT_HERO_PHRASES,
  phraseCycleDistance,
}: GlassDoorRevealProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const leftEdgeRef = useRef<HTMLDivElement | null>(null);
  const rightEdgeRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const phraseRefs = useRef<(HTMLDivElement | null)[]>([]);
  const smallLogoRef = useRef<HTMLDivElement | null>(null);
  const cueRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const targetTimeRef = useRef(0);
  const videoProgressRef = useRef(0);

  // ----- AUTO-CALCULATED TOTAL SCROLL -----
  const doorEnd = doorStartProgress + doorScrollDistance;
  const videoEnd = videoStartProgress + videoScrollDistance;

  const logoHoldUnits = logoHoldBeforeOutVh / 100 / scrollLength;
  const resolvedLogoOutStart =
    (logoOutStartProgress ?? doorEnd + videoScrollDistance * 0.1) + logoHoldUnits;
  const logoFadeEnd = resolvedLogoOutStart + logoOutDistance;
  const smallLogoStart = logoFadeEnd;
  const smallLogoEnd = showSmallLogo
    ? smallLogoStart + smallLogoInDistance
    : logoFadeEnd;

  const resolvedPhraseCycle =
    phraseCycleDistance ??
    Math.max((videoEnd - logoFadeEnd) / Math.max(heroPhrases.length, 1), 0.12);
  const phrasesStart = logoFadeEnd;
  const phrasesEnd = showHeroPhrases
    ? phrasesStart + heroPhrases.length * resolvedPhraseCycle
    : logoFadeEnd;

  // The whole choreography is done at whichever finishes LAST.
  const completion = Math.max(
    doorEnd,
    videoEnd,
    smallLogoEnd,
    phrasesEnd,
    0.0001,
  );
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
      const lOutStart = resolvedLogoOutStart / totalUnits;
      const lOut = logoOutDistance / totalUnits;
      const sStart = smallLogoStart / totalUnits;
      const sIn = smallLogoInDistance / totalUnits;
      const phraseCycle = resolvedPhraseCycle / totalUnits;
      const phraseFadeIn = phraseCycle * 0.22;
      const phraseFadeOut = phraseCycle * 0.22;

      const syncLogoMask = () => {
        if (!logoRef.current || !leftEdgeRef.current || !rightEdgeRef.current) {
          return;
        }

        const logoRect = logoRef.current.getBoundingClientRect();
        if (logoRect.width <= 0) return;

        const leftSeamX = seamCenterX(leftEdgeRef.current);
        const rightSeamX = seamCenterX(rightEdgeRef.current);

        const leftInset =
          ((leftSeamX - logoRect.left) / logoRect.width) * 100;
        const rightInset =
          ((logoRect.right - rightSeamX) / logoRect.width) * 100;

        applyLogoDoorMask(logoRef.current, leftInset, rightInset);
      };

      let rafId = 0;
      let lastSeekTime = 0;
      let seekTime = video.currentTime || 0;
      const glide = Math.min(Math.max(videoGlide, 0.01), 1);

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

        const desired = targetTimeRef.current;
        seekTime += (desired - seekTime) * glide;
        if (Math.abs(desired - seekTime) < 0.002) seekTime = desired;

        // Always publish smoothed progress so the butterfly tracks glide, not raw scroll.
        videoProgressRef.current = seekTime / video.duration;

        const now = performance.now();
        if (
          now - lastSeekTime >= 14 &&
          Math.abs(video.currentTime - seekTime) > 0.01
        ) {
          video.currentTime = seekTime;
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
            syncLogoMask();
          },
        },
      });

      // Lock the timeline length to exactly 1.0 so nothing gets re-stretched.
      tl.to({}, { duration: 1 }, 0);

      if (variant === "swing") {
        tl.to(
          left,
          { rotateY: -SWING_ANGLE, duration: dDur, onUpdate: syncLogoMask },
          dStart,
        ).to(
          right,
          { rotateY: SWING_ANGLE, duration: dDur, onUpdate: syncLogoMask },
          dStart,
        );
      } else {
        tl.to(
          left,
          { xPercent: -100, duration: dDur, onUpdate: syncLogoMask },
          dStart,
        ).to(
          right,
          { xPercent: 100, duration: dDur, onUpdate: syncLogoMask },
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

      if (logoRef.current) {
        const logoEl = logoRef.current;

        syncLogoMask();
        gsap.set(logoEl, { opacity: 1 });

        tl.to(
          logoEl,
          {
            opacity: 0,
            ease: "power2.in",
            duration: lOut,
          },
          lOutStart,
        );
      }

      if (showSmallLogo && smallLogoRef.current) {
        gsap.set(smallLogoRef.current, { y: "-120%", opacity: 0 });

        tl.to(
          smallLogoRef.current,
          {
            y: 0,
            opacity: 1,
            ease: "power2.out",
            duration: sIn,
          },
          sStart,
        );
      }

      if (showHeroPhrases) {
        heroPhrases.forEach((_, index) => {
          const phraseEl = phraseRefs.current[index];
          if (!phraseEl) return;

          const phraseStart =
            phrasesStart / totalUnits + index * phraseCycle;

          gsap.set(phraseEl, { opacity: 0 });

          tl.to(
            phraseEl,
            {
              opacity: 1,
              ease: "power2.out",
              duration: phraseFadeIn,
            },
            phraseStart,
          ).to(
            phraseEl,
            {
              opacity: 0,
              ease: "power2.in",
              duration: phraseFadeOut,
            },
            phraseStart + phraseCycle - phraseFadeOut,
          );
        });
      }

      if (tl.scrollTrigger) {
        syncLogoMask();
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
        videoGlide,
        holdAfter,
        totalUnits,
        totalVh,
        showLogo,
        logoOutDistance,
        resolvedLogoOutStart,
        doorEnd,
        doorStartProgress,
        logoHoldBeforeOutVh,
        showSmallLogo,
        smallLogoInDistance,
        smallLogoStart,
        showHeroPhrases,
        heroPhrases,
        resolvedPhraseCycle,
        phrasesStart,
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
          isolation: "isolate",
        }}
      >
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />

        {showButterfly && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              pointerEvents: "none",
            }}
          >
            <HeroButterflyCanvas
              progressRef={videoProgressRef}
              // editorMode={process.env.NODE_ENV === "development"}
              editorVideoSrc={src}
            />
          </div>
        )}

        {showLogo && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: "20%",
              zIndex: 3,
              width: "min(96vw, 720px)",
              transform: "translateX(-50%)",
              pointerEvents: "none",
            }}
          >
            <div
              ref={logoRef}
              style={{
                opacity: 1,
                willChange: "opacity, clip-path",
              }}
            >
              <Image
                src={logoSrc}
                alt="makonis.ai"
                width={720}
                height={166}
                priority
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              />
            </div>
          </div>
        )}

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            perspective: "1700px",
            zIndex: 4,
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
          >
            <div
              ref={leftEdgeRef}
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                width: 1,
                pointerEvents: "none",
              }}
            />
          </div>
          <div
            ref={rightRef}
            style={{
              ...doorBase,
              right: 0,
              borderLeft: `0.5px solid ${SEAM}`,
              transformStyle: "preserve-3d",
            }}
          >
            <div
              ref={rightEdgeRef}
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                width: 1,
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {heading != null && (
          <div
            ref={textRef}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "0 24px",
              pointerEvents: "none",
              color: "#ffffff",
            }}
          >
          <div className="flex flex-col  items-center">
          <h1 className="mt-8 font-bold font-makonis-heading-bold max-w-2xl">
            Where AI meets human potential.
          </h1>
        </div>
          </div>
        )}

        {showHeroPhrases &&
          heroPhrases.map((phrase, index) => (
            <div
              key={phrase.title}
              style={{
                position: "absolute",
                left: "50%",
                bottom: "20%",
                zIndex: 6,
                width: "min(96vw, 720px)",
                transform: "translateX(-50%)",
                pointerEvents: "none",
              }}
            >
              <div
                ref={(el) => {
                  phraseRefs.current[index] = el;
                }}
                className="flex flex-col items-center text-center text-white"
                style={{ opacity: 0, willChange: "opacity" }}
              >
                <h1 className="font-makonis-heading-bold max-w-2xl">
                  {phrase.title}
                </h1>
                <h1 className="font-makonis-heading-bold mt-2 max-w-2xl">
                  {phrase.tagline}
                </h1>
              </div>
            </div>
          ))}

        {showSmallLogo && (
          <div
            style={{
              position: "absolute",
              top: "5%",
              left: 0,
              right: 0,
              zIndex: 6,
              display: "flex",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div
              ref={smallLogoRef}
              style={{
                width: "min(42vw, 200px)",
                opacity: 0,
                willChange: "transform, opacity",
              }}
            >
              <Image
                src={smallLogoSrc ?? logoSrc}
                alt="makonis.ai"
                width={200}
                height={46}
                priority
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              />
            </div>
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
              zIndex: 6,
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
