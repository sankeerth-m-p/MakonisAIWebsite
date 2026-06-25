"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { publishDoorEdges } from "@/lib/doorReveal";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function ExitGlassDoorSection() {
  const rootRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const leftDoorRef = useRef<HTMLDivElement | null>(null);
  const rightDoorRef = useRef<HTMLDivElement | null>(null);
  const leftContentDoorRef = useRef<HTMLDivElement | null>(null);
  const rightContentDoorRef = useRef<HTMLDivElement | null>(null);
  const closedFrostRef = useRef<HTMLDivElement | null>(null);
  const leftEdgeRef = useRef<HTMLDivElement | null>(null);
  const rightEdgeRef = useRef<HTMLDivElement | null>(null);

  const seamCenterX = (el: HTMLElement): number => {
    const rect = el.getBoundingClientRect();
    return rect.left + rect.width / 2;
  };

  useGSAP(
    () => {
      const root = rootRef.current;
      const pin = pinRef.current;
      const leftDoor = leftDoorRef.current;
      const rightDoor = rightDoorRef.current;
      const leftContentDoor = leftContentDoorRef.current;
      const rightContentDoor = rightContentDoorRef.current;
      const closedFrost = closedFrostRef.current;
      const leftEdge = leftEdgeRef.current;
      const rightEdge = rightEdgeRef.current;
      if (
        !root ||
        !pin ||
        !leftDoor ||
        !rightDoor ||
        !leftContentDoor ||
        !rightContentDoor ||
        !closedFrost ||
        !leftEdge ||
        !rightEdge
      ) {
        return;
      }

      const syncNavbarMask = () => {
        const leftSeamX = seamCenterX(leftEdge);
        const rightSeamX = seamCenterX(rightEdge);
        publishDoorEdges(leftSeamX, rightSeamX);
      };

      // Start in the "open" state and close while scrolling down.
      gsap.set(leftDoor, {
        xPercent: -100,
        opacity: 0.88,
      });
      gsap.set(rightDoor, {
        xPercent: 100,
        opacity: 0.88,
      });
      gsap.set(leftContentDoor, {
        xPercent: -100,
        opacity: 1,
      });
      gsap.set(rightContentDoor, {
        xPercent: 100,
        opacity: 1,
      });
      gsap.set(closedFrost, { opacity: 0 });

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "+=140%",
          pin,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      timeline
        .to(leftDoor, { xPercent: 0, duration: 1 }, 0)
        .to(rightDoor, { xPercent: 0, duration: 1 }, 0)
        .to(leftContentDoor, { xPercent: 0, duration: 1 }, 0)
        .to(rightContentDoor, { xPercent: 0, duration: 1 }, 0)
        .to([leftDoor, rightDoor], { opacity: 1, duration: 1 }, 0);
      timeline
        .to(closedFrost, { opacity: 1, duration: 0.1 }, 1)
        .to(
          [leftDoor, rightDoor],
          { opacity: 0, duration: 0.1 },
          1,
        );
      timeline.eventCallback("onUpdate", syncNavbarMask);
      syncNavbarMask();
    },
    { scope: rootRef },
  );

  const frostBackdropClass =
    "bg-[rgba(244,247,251,0.12)] [backdrop-filter:blur(16px)_saturate(118%)_brightness(1.02)] [-webkit-backdrop-filter:blur(16px)_saturate(118%)_brightness(1.02)]";
  const doorBaseClass = `absolute top-0 bottom-0 z-2 w-1/2 ${frostBackdropClass} backface-hidden [-webkit-backface-visibility:hidden] will-change-[transform,opacity] transform-3d overflow-hidden`;

  return (
    <section
      id="exit-door"
      ref={rootRef}
      className="snap-section relative z-50 min-h-screen"
    >
      <div
        ref={pinRef}
        className="relative h-screen overflow-hidden isolate bg-[#0f1013]"
      >
        <Image
          src="/finalFrame.png"
          alt="Exit background"
          fill
          priority={false}
          className="z-0 object-cover object-center"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 z-1 bg-[linear-gradient(90deg,rgba(10,11,15,0.58)_0%,rgba(22,23,27,0.34)_42%,rgba(241,196,131,0.18)_100%)]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-4 perspective-[1700px] transform-3d"
        >
          <div
            ref={leftDoorRef}
            className={`${doorBaseClass} left-0`}
          >
            <div
              ref={leftEdgeRef}
              className="pointer-events-none absolute top-0 right-0 bottom-0 w-px"
            />
            <div className="absolute inset-0 z-1" />
          </div>

          <div
            ref={rightDoorRef}
            className={`${doorBaseClass} left-1/2`}
          >
            <div
              ref={rightEdgeRef}
              className="pointer-events-none absolute top-0 bottom-0 left-0 w-px"
            />
            <div className="absolute inset-0 z-1" />
          </div>

          <div
            ref={closedFrostRef}
            className={`pointer-events-none absolute inset-0 z-4 opacity-0 will-change-[opacity] ${frostBackdropClass}`}
          />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-6 perspective-[1700px] transform-3d"
        >
          <div
            ref={leftContentDoorRef}
            className="absolute top-0 bottom-0 left-0 flex w-1/2 items-center justify-start p-[clamp(1.5rem,4vw,5rem)] backface-hidden [-webkit-backface-visibility:hidden] transform-3d will-change-[transform,opacity]"
          >
            <h1 className="max-w-[16ch] text-white">
              Powerfully smart.
              <br />
              Impressively light.
            </h1>
          </div>

          <div
            ref={rightContentDoorRef}
            className="absolute top-0 bottom-0 left-1/2 flex w-1/2 items-start justify-center p-[clamp(1.2rem,3.4vw,2.1rem)_clamp(1.05rem,2.8vw,1.8rem)] backface-hidden [-webkit-backface-visibility:hidden] transform-3d will-change-[transform,opacity]"
          >
            <div className="flex h-full w-full max-w-[520px] flex-col text-white">
              <div className="flex w-full max-w-[420px] flex-1 flex-col items-start justify-center text-left">
                <Image
                  src="/makonis_ai_logo.png"
                  alt="makonis.ai"
                  width={250}
                  height={58}
                  className="h-auto w-[clamp(186px,17vw,250px)]"
                />

                <h4 className="mt-[clamp(1rem,2vw,1.6rem)]">
                  A unit of Makonis Software
                </h4>

                <div className="mt-[clamp(0.95rem,1.6vw,1.4rem)] h-px w-full bg-[rgba(255,255,255)]" />

                <p className="mt-[clamp(0.9rem,1.5vw,1.3rem)] ">
                  Interested in learning more?
                </p>

                <p className="eyebrow mt-[clamp(2rem,4vw,3.1rem)] ">
                  Contact us
                </p>
                <p className="mt-2">
                  info@makonisoft.com
                </p>

                <p className=" eyebrow mt-[clamp(2.1rem,3.8vw,2.9rem)] ">
                  Follow us on
                </p>
                <div
                  className="mt-3 flex items-center gap-[clamp(1rem,1.8vw,1.55rem)] "
                >
                  <FaInstagram aria-label="Instagram" className="text-base" />
                  <FaFacebookF aria-label="Facebook" className="text-sm" />
                  <FaLinkedinIn aria-label="LinkedIn" className="text-sm" />
                  <FaXTwitter aria-label="X (Twitter)" className="text-sm" />
                </div>
              </div>

              <span
                className="eyebrow mb-[clamp(0.7rem,1.5vw,1.1rem)] text-left text-xs"
              >
                Copyright@Makonis 2017
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
