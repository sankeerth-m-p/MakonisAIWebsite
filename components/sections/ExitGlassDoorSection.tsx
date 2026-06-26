"use client";

import { useRef } from "react";
import Image from "next/image";
import MidnightClearSkyBackground from "@/components/MidnightClearSkyBackground";
import VideoScrollZoomBackground from "@/components/VideoScrollZoomBackground";
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

const CONTACT_EMAIL = "info@makonissoft.com";

const SOCIAL_LINKS = [
  {
    href: "https://www.instagram.com/makonissoft/",
    label: "Instagram",
    Icon: FaInstagram,
    className: "text-base",
  },
  {
    href: "https://www.facebook.com/makonissoft/",
    label: "Facebook",
    Icon: FaFacebookF,
    className: "text-sm",
  },
  {
    href: "https://www.linkedin.com/company/makonissoftwaresolutions-pvt-ltd",
    label: "LinkedIn",
    Icon: FaLinkedinIn,
    className: "text-sm",
  },
  {
    href: "https://twitter.com/makonissoft",
    label: "X (Twitter)",
    Icon: FaXTwitter,
    className: "text-sm",
  },
] as const;

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
  const videoProgressRef = useRef(0);

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

      const videoProgressObj = { value: 0 };

      const zoomDuration = 1;
      const holdDuration = 1;
      const doorDuration = 1;
      const doorStart = zoomDuration + holdDuration;

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "+=360%",
          pin,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      // Video zoom (0 → 1) over midnight sky
      timeline.to(
        videoProgressObj,
        {
          value: 1,
          duration: zoomDuration,
          ease: "none",
          onUpdate: () => {
            videoProgressRef.current = videoProgressObj.value;
          },
        },
        0,
      );

      // Hold — zoomed video, no door motion
      timeline.to({}, { duration: holdDuration }, zoomDuration);

      // Door close — starts after the hold
      timeline
        .to(leftDoor, { xPercent: 0, duration: doorDuration }, doorStart)
        .to(rightDoor, { xPercent: 0, duration: doorDuration }, doorStart)
        .to(leftContentDoor, { xPercent: 0, duration: doorDuration }, doorStart)
        .to(rightContentDoor, { xPercent: 0, duration: doorDuration }, doorStart)
        .to([leftDoor, rightDoor], { opacity: 1, duration: doorDuration }, doorStart);
      timeline
        .to(closedFrost, { opacity: 1, duration: 0.1 }, doorStart + doorDuration)
        .to(
          [leftDoor, rightDoor],
          { opacity: 0, duration: 0.1 },
          doorStart + doorDuration,
        );
      timeline.eventCallback("onUpdate", syncNavbarMask);
      syncNavbarMask();
      videoProgressRef.current = videoProgressObj.value;
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
      className="snap-section  relative z-50 min-h-screen"
    >
      <div
        ref={pinRef}
        className="relative h-screen overflow-hidden isolate "
      >
        <MidnightClearSkyBackground />
        <div className="absolute inset-0 z-1">
          <VideoScrollZoomBackground
            progressRef={videoProgressRef}
            maskStartWidth={0.88}
            maskStartInset={24}
          />
        </div>

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
            className="pointer-events-auto absolute top-0 bottom-0 left-1/2 flex w-1/2 items-start justify-center p-[clamp(1.2rem,3.4vw,2.1rem)_clamp(1.05rem,2.8vw,1.8rem)] backface-hidden [-webkit-backface-visibility:hidden] transform-3d will-change-[transform,opacity]"
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
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="transition-opacity hover:opacity-80"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </p>

                <p className=" eyebrow mt-[clamp(2.1rem,3.8vw,2.9rem)] ">
                  Follow us on
                </p>
                <div className="mt-3 flex items-center gap-[clamp(1rem,1.8vw,1.55rem)]">
                  {SOCIAL_LINKS.map(({ href, label, Icon, className }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="transition-opacity hover:opacity-80"
                    >
                      <Icon className={className} />
                    </a>
                  ))}
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
