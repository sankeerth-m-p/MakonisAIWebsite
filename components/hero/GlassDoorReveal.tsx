"use client";

import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import HeroButterflyCanvas from "@/components/hero/HeroButterflyCanvas";
import { publishDoorEdges } from "@/lib/doorReveal";

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

function animateHeroPhrase(el: HTMLElement, localProgress: number) {
  let opacity = 0;
  let y = 0;

  if (localProgress <= 0.4) {
    const p = localProgress / 0.4;
    opacity = 0.25 + p * 0.75;
    y = 20 - 20 * p;
  } else if (localProgress <= 0.6) {
    opacity = 1;
    y = 0;
  } else {
    const p = (localProgress - 0.6) / 0.4;
    opacity = 1 - p;
    y = p * 20;
  }

  el.style.opacity = String(opacity);
  el.style.transform = `translateY(${y}px)`;
}

function syncHeroPhrases(
  progress: number,
  phraseEls: (HTMLDivElement | null)[],
  phraseStart: number,
  phraseEnd: number,
) {
  const count = phraseEls.length;
  if (count === 0) return;

  phraseEls.forEach((el) => {
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(0px)";
  });

  if (progress < phraseStart || progress >= phraseEnd) return;

  const regionProgress = (progress - phraseStart) / (phraseEnd - phraseStart);
  const segment = 1 / count;

  for (let index = 0; index < count; index++) {
    const segStart = index * segment;
    const segEnd = (index + 1) / count;
    const isLast = index === count - 1;

    if (
      regionProgress >= segStart &&
      (isLast ? regionProgress <= segEnd : regionProgress < segEnd)
    ) {
      const el = phraseEls[index];
      if (el) {
        animateHeroPhrase(
          el,
          (regionProgress - segStart) / (segEnd - segStart),
        );
      }
      break;
    }
  }
}

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
  const closedFrostRef = useRef<HTMLDivElement | null>(null);
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
      const closedFrost = closedFrostRef.current;
      const video = videoRef.current;
      if (!root || !pin || !left || !right || !video) return;

      gsap.set(left, { transformOrigin: "left center", opacity: 1 });
      gsap.set(right, { transformOrigin: "right center", opacity: 1 });
      if (closedFrost) {
        gsap.set(closedFrost, { opacity: 1 });
      }

      // Normalize each sub-range into the 0..1 timeline space.
      const dStart = doorStartProgress / totalUnits;
      const dDur = doorScrollDistance / totalUnits;
      const vStart = videoStartProgress / totalUnits;
      const vEnd = videoEnd / totalUnits;
      const lOutStart = resolvedLogoOutStart / totalUnits;
      const lOut = logoOutDistance / totalUnits;
      const sStart = smallLogoStart / totalUnits;
      const sIn = smallLogoInDistance / totalUnits;
      const phraseStartProgress = phrasesStart / totalUnits;
      const phraseEndProgress = phrasesEnd / totalUnits;

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

        // Drive any out-of-tree reveal targets (e.g. the fixed Navbar) with the
        // exact same door-edge geometry, on the same update cadence.
        publishDoorEdges(leftSeamX, rightSeamX);
      };

      let rafId = 0;
      let lastSeekTime = 0;
      let seekTime = 0;
      let scrollEngaged = false;
      const glide = Math.min(Math.max(videoGlide, 0.01), 1);
      const HERO_IDLE_EPS = 0.001;

      const computeTargetTime = (progress: number): number => {
        if (!video.duration) return 0;
        if (progress <= vStart) return 0; // frozen on first frame
        if (progress >= vEnd) return video.duration; // frozen on last frame

        const span = vEnd - vStart || 1;
        const videoProgress = (progress - vStart) / span;
        return Math.min(Math.max(videoProgress, 0), 1) * video.duration;
      };

      const engageScroll = (progress: number) => {
        if (scrollEngaged) return;
        scrollEngaged = true;
        video.loop = false;
        video.pause();
        seekTime = 0;
        video.currentTime = 0;
        targetTimeRef.current = computeTargetTime(progress);
        videoProgressRef.current = 0;
      };

      const disengageScroll = () => {
        if (!scrollEngaged) return;
        scrollEngaged = false;
        seekTime = 0;
        targetTimeRef.current = 0;
        videoProgressRef.current = 0;
        video.loop = true;
        void video.play().catch(() => {});
      };

      const isAtHeroStart = (progress: number) =>
        progress <= HERO_IDLE_EPS && window.scrollY <= 1;

      const canAutoplay = () => {
        if (!document.documentElement.classList.contains("preloader-active")) {
          return true;
        }
        return document.querySelector(".preloader-content--visible") !== null;
      };

      const tryAutoplay = () => {
        if (scrollEngaged || !video.duration || !canAutoplay()) {
          return;
        }
        video.muted = true;
        video.loop = true;
        if (video.paused) {
          void video.play().catch(() => {});
        }
      };

      const onVideoReady = () => tryAutoplay();
      video.addEventListener("loadeddata", onVideoReady);
      video.addEventListener("canplay", onVideoReady);
      if (video.readyState >= 2) onVideoReady();

      const onContentReady = () => tryAutoplay();
      window.addEventListener("makonis:content-ready", onContentReady);

      const rafLoop = () => {
        rafId = window.requestAnimationFrame(rafLoop);
        if (!video.duration) return;

        if (!scrollEngaged) {
          // Butterfly stays at t=0 while the video loops freely in the background.
          videoProgressRef.current = 0;
          tryAutoplay();
          return;
        }

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
            if (isAtHeroStart(self.progress)) {
              disengageScroll();
            } else if (scrollEngaged) {
              targetTimeRef.current = computeTargetTime(self.progress);
            }
            syncLogoMask();
            if (showHeroPhrases) {
              syncHeroPhrases(
                self.progress,
                phraseRefs.current,
                phraseStartProgress,
                phraseEndProgress,
              );
            }
          },
        },
      });

      const engageFromUser = () => {
        const progress = tl.scrollTrigger?.progress ?? 0;
        if (isAtHeroStart(progress)) return;
        engageScroll(progress);
      };

      const onUserScrollIntent = () => {
        if (!scrollEngaged) engageFromUser();
      };

      const scrollKeys = new Set([
        "ArrowDown",
        "ArrowUp",
        "PageDown",
        "PageUp",
        " ",
        "Home",
        "End",
      ]);
      const onKeyDown = (e: KeyboardEvent) => {
        if (scrollKeys.has(e.key)) onUserScrollIntent();
      };

      const onScrollEngage = () => {
        if (!scrollEngaged && window.scrollY > 0) engageFromUser();
        if (scrollEngaged && window.scrollY <= 1) {
          const progress = tl.scrollTrigger?.progress ?? 0;
          if (isAtHeroStart(progress)) disengageScroll();
        }
      };

      window.addEventListener("wheel", onUserScrollIntent, { passive: true });
      window.addEventListener("touchmove", onUserScrollIntent, { passive: true });
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("scroll", onScrollEngage, { passive: true });

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

      const snapDur = 0.008;
      if (closedFrost) {
        tl.to(closedFrost, { opacity: 0, duration: snapDur }, dStart);
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

      if (tl.scrollTrigger) {
        syncLogoMask();
        if (showHeroPhrases) {
          syncHeroPhrases(
            tl.scrollTrigger.progress,
            phraseRefs.current,
            phraseStartProgress,
            phraseEndProgress,
          );
        }
      }

      return () => {
        video.removeEventListener("loadeddata", onVideoReady);
        video.removeEventListener("canplay", onVideoReady);
        window.removeEventListener("makonis:content-ready", onContentReady);
        window.removeEventListener("wheel", onUserScrollIntent);
        window.removeEventListener("touchmove", onUserScrollIntent);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("scroll", onScrollEngage);
        video.pause();
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
        phrasesEnd,
      ],
    },
  );

  const frostStyle: CSSProperties = {
    background: FROST,
    WebkitBackdropFilter: "blur(16px) saturate(118%) brightness(1.02)",
    backdropFilter: "blur(16px) saturate(118%) brightness(1.02)",
  };

  const doorBase: CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "50%",
    ...frostStyle,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    willChange: "transform, opacity",
    transformStyle: "preserve-3d",
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
          loop
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
          <div ref={leftRef} style={{ ...doorBase, left: 0 }}>
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
          <div ref={rightRef} style={{ ...doorBase, left: "50%" }}>
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
          <div
            ref={closedFrostRef}
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              ...frostStyle,
              pointerEvents: "none",
              zIndex: 4,
              opacity: 1,
              willChange: "opacity",
            }}
          />
        </div>

        {heading != null && (
          <div
            ref={textRef}
            className="z-40"
            style={{
              position: "absolute",
              inset: 0,
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
          <h1 className="mt-8 font-extrabold font-makonis-heading-bold max-w-2xl">
            Where AI meets human potential.
          </h1>
        </div>
          </div>
        )}

        {showHeroPhrases &&
          heroPhrases.map((phrase, index) => (
            <div
              key={phrase.title}
              className="z-40"
              style={{
                position: "absolute",
                left: "50%",
                bottom: "20%",
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
                style={{ opacity: 0, willChange: "opacity, transform" }}
              >
                <h2 className="font-extrabold font-makonis-heading-bold max-w-2xl">
                  {phrase.title}
                </h2>
                <h2 className="font-extrabold font-makonis-heading-bold mt-2 max-w-2xl">
                  {phrase.tagline}
                </h2>
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
              right: 24,
              bottom: 24,
              zIndex: 6,
              color: "#ffffff",
            }}
          >
            <p className="text-xs tracking-wide opacity-80">scroll to open</p>
          </div>
        )}
      </div>
    </section>
  );
}
