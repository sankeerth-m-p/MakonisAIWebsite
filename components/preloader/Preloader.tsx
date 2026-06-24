"use client";

import Image from "next/image";
import {
  PRELOADER_AUTHOR,
  PRELOADER_GRADIENT_STOPS,
  PRELOADER_LOGO_SRC,
  PRELOADER_QUOTE,
} from "@/data/preloader";

type PreloaderProps = {
  progress: number;
  exiting?: boolean;
};

const RING_RADIUS = 36;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function Preloader({ progress, exiting = false }: PreloaderProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const strokeOffset =
    RING_CIRCUMFERENCE - (clamped / 100) * RING_CIRCUMFERENCE;

  return (
    <div
      className={`preloader-overlay ${exiting ? "preloader-overlay--exit" : ""}`}
      aria-hidden={exiting}
      aria-live="polite"
      aria-busy={!exiting}
    >
      <div className="preloader-stack">
        <div className="preloader-logo">
          <Image
            src={PRELOADER_LOGO_SRC}
            alt="Makonis AI"
            width={220}
            height={50}
            priority
            className="h-auto w-[min(220px,70vw)]"
          />
        </div>

        <blockquote className="preloader-quote">
          &ldquo;{PRELOADER_QUOTE}&rdquo;
        </blockquote>

        <p className="preloader-author">&mdash; {PRELOADER_AUTHOR}</p>

        <div className="preloader-ring" aria-label={`Loading ${clamped}%`}>
          <svg
            width="88"
            height="88"
            viewBox="0 0 88 88"
            className="preloader-ring__svg"
            aria-hidden
          >
            <defs>
              <linearGradient
                id="preloader-ring-gradient"
                gradientUnits="userSpaceOnUse"
                x1="14"
                y1="14"
                x2="74"
                y2="74"
              >
                {PRELOADER_GRADIENT_STOPS.map((stop) => (
                  <stop
                    key={stop.offset}
                    offset={stop.offset}
                    stopColor={stop.color}
                  />
                ))}
              </linearGradient>
              <linearGradient
                id="preloader-text-gradient"
                gradientUnits="objectBoundingBox"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                {PRELOADER_GRADIENT_STOPS.map((stop) => (
                  <stop
                    key={`text-${stop.offset}`}
                    offset={stop.offset}
                    stopColor={stop.color}
                  />
                ))}
              </linearGradient>
            </defs>
            <circle
              cx="44"
              cy="44"
              r={RING_RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
            />
            <circle
              cx="44"
              cy="44"
              r={RING_RADIUS}
              fill="none"
              stroke="url(#preloader-ring-gradient)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeOffset}
              transform="rotate(-90 44 44)"
              className="preloader-ring__progress"
            />
            <text
              x="44"
              y="44"
              textAnchor="middle"
              dominantBaseline="central"
              fill="url(#preloader-text-gradient)"
              className="preloader-ring__label"
            >
              {clamped}%
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
