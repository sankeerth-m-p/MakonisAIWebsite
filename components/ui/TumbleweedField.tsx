"use client";

/**
 * Automatic, wind-blown tumbleweeds along the bottom of a section.
 * Both follow the same gust pattern, with different travel speeds.
 */
type Props = {
  className?: string;
};

export default function TumbleweedField({ className = "" }: Props) {
  return (
    <div className={`tumbleweed-field ${className}`} aria-hidden>
      <div className="tw-wind">
        <span className="tw-streak s1" />
        <span className="tw-streak s2" />
        <span className="tw-streak s3" />
      </div>

      <div className="tw-roller">
        <div className="tw-lift">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tumbleweed.svg" alt="" className="tw-roll" draggable={false} />
        </div>
      </div>

      <div className="tw-drifter">
        <div className="tw-drifter-lift">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tumbleweed2.svg" alt="" className="tw-sway" draggable={false} />
        </div>
      </div>

      <style jsx>{`
        .tumbleweed-field {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 20;
          --tw-darken: brightness(0.48) saturate(1.2) contrast(1.12);
          --tw-ground: 4%;
          --tw-size: clamp(92px, 11.5vw, 176px);
        }

        .tw-roller {
          position: absolute;
          bottom: var(--tw-ground);
          left: 0;
          width: var(--tw-size);
          height: var(--tw-size);
          animation: tw-travel 17s linear infinite;
          will-change: left;
        }

        .tw-lift,
        .tw-drifter-lift {
          width: 100%;
          height: 100%;
          animation: tw-fly 17s linear infinite;
          will-change: transform;
        }

        .tw-roll,
        .tw-sway {
          display: block;
          width: 100%;
          height: 100%;
          opacity: 0.96;
          filter: var(--tw-darken);
          transform-origin: 50% 50%;
          will-change: transform;
        }

        .tw-roll {
          animation: tw-spin 17s linear infinite;
        }

        .tw-drifter {
          position: absolute;
          bottom: var(--tw-ground);
          left: 0;
          width: calc(var(--tw-size) * 1.04);
          height: calc(var(--tw-size) * 1.04);
          animation:
            tw-travel-center-first 9.5s linear 1 forwards,
            tw-travel 19s linear 9.5s infinite;
          will-change: left;
        }

        .tw-drifter-lift {
          animation-duration: 19s;
        }

        .tw-sway {
          animation: tw-spin-slow 19s linear infinite;
        }

        .tw-wind {
          position: absolute;
          inset: 0;
        }

        .tw-streak {
          position: absolute;
          height: 2px;
          border-radius: 2px;
          opacity: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(54, 33, 17, 0.5),
            transparent
          );
        }

        .s1 {
          bottom: 26%;
          left: 60%;
          width: 110px;
          animation: tw-whoosh 17s linear infinite;
        }

        .s2 {
          bottom: 16%;
          left: 74%;
          width: 80px;
          animation: tw-whoosh 17s linear infinite -3s;
        }

        .s3 {
          bottom: 34%;
          left: 50%;
          width: 130px;
          animation: tw-whoosh 17s linear infinite -6s;
        }

        @media (prefers-color-scheme: dark) {
          .tumbleweed-field {
            --tw-darken: brightness(0.72) saturate(1.05) contrast(1.05);
          }

          .tw-streak {
            background: linear-gradient(
              90deg,
              transparent,
              rgba(117, 83, 49, 0.55),
              transparent
            );
          }
        }

        @keyframes tw-travel {
          0% {
            left: 104%;
          }
          8% {
            left: 96%;
          }
          26% {
            left: 64%;
          }
          50% {
            left: 42%;
          }
          70% {
            left: 14%;
          }
          88% {
            left: -8%;
          }
          100% {
            left: -22%;
          }
        }

        @keyframes tw-travel-center-first {
          0% {
            left: 50%;
          }
          8% {
            left: 46%;
          }
          26% {
            left: 30%;
          }
          50% {
            left: 14%;
          }
          70% {
            left: -2%;
          }
          88% {
            left: -15%;
          }
          100% {
            left: -24%;
          }
        }

        @keyframes tw-fly {
          0%,
          8% {
            transform: translateY(0);
          }
          13% {
            transform: translateY(-46px);
          }
          18% {
            transform: translateY(-12px);
          }
          26% {
            transform: translateY(0);
          }
          52% {
            transform: translateY(0);
          }
          58% {
            transform: translateY(-40px);
          }
          64% {
            transform: translateY(-10px);
          }
          70% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(0);
          }
        }

        @keyframes tw-spin {
          0% {
            transform: rotate(0);
          }
          26% {
            transform: rotate(-340deg);
          }
          50% {
            transform: rotate(-700deg);
          }
          70% {
            transform: rotate(-1040deg);
          }
          100% {
            transform: rotate(-1480deg);
          }
        }

        @keyframes tw-spin-slow {
          0% {
            transform: rotate(0);
          }
          26% {
            transform: rotate(-260deg);
          }
          50% {
            transform: rotate(-520deg);
          }
          70% {
            transform: rotate(-780deg);
          }
          100% {
            transform: rotate(-1080deg);
          }
        }

        @keyframes tw-whoosh {
          0%,
          7% {
            opacity: 0;
            transform: translateX(60px) scaleX(0.6);
          }
          12% {
            opacity: 0.55;
            transform: translateX(-160px) scaleX(1.3);
          }
          18% {
            opacity: 0;
            transform: translateX(-260px) scaleX(0.8);
          }
          100% {
            opacity: 0;
            transform: translateX(-260px) scaleX(0.8);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tw-roller,
          .tw-lift,
          .tw-roll,
          .tw-drifter,
          .tw-drifter-lift,
          .tw-sway {
            animation: none;
          }

          .tw-roller {
            left: 74%;
          }

          .tw-drifter {
            left: 50%;
          }

          .tw-wind {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
