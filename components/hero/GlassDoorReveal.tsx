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
  alt?: string;
  heading?: ReactNode;
  variant?: "swing" | "slide";
  scrollLength?: number;
  showCue?: boolean;
  className?: string;
};

const SEAM = "rgba(255,236,214,0.30)";
const FROST = "rgba(244,247,251,0.10)";
const SWING_ANGLE = 118;

export default function GlassDoorReveal({
  id,
  src,
  alt = "",
  heading,
  variant = "swing",
  scrollLength = 2.5,
  showCue = true,
  className,
}: GlassDoorRevealProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const cueRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const left = leftRef.current;
      const right = rightRef.current;
      if (!root || !left || !right) return;

      gsap.set(left, { transformOrigin: "left center" });
      gsap.set(right, { transformOrigin: "right center" });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
        },
      });

      if (variant === "swing") {
        tl.to(left, { rotateY: -SWING_ANGLE }, 0).to(
          right,
          { rotateY: SWING_ANGLE },
          0,
        );
      } else {
        tl.to(left, { xPercent: -100 }, 0).to(right, { xPercent: 100 }, 0);
      }

      tl.to([left, right], { opacity: 0.88 }, 0);

      if (textRef.current) {
        tl.to(textRef.current, { autoAlpha: 0, duration: 0.5 }, 0);
      }
      if (cueRef.current) {
        tl.to(cueRef.current, { autoAlpha: 0, duration: 0.06 }, 0);
      }
    },
    { scope: rootRef, dependencies: [variant] },
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
      style={{ position: "relative", height: `${scrollLength * 100}vh` }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          backgroundColor: "#0a1b30",
          zIndex: 0,
        }}
      >
        <img
          src={src}
          alt={alt}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
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
