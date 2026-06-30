"use client";

/**
 * Static tumbleweeds along the bottom of a section.
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
          --tw-size: clamp(92px, 11.5vw, 176px);
        }

        .tw-roller {
          position: absolute;
          right: 10%;
          bottom: 5%;
          width: var(--tw-size);
          height: var(--tw-size);
        }

        .tw-lift,
        .tw-drifter-lift {
          width: 100%;
          height: 100%;
        }

        .tw-roll,
        .tw-sway {
          display: block;
          width: 100%;
          height: 100%;
          opacity: 0.96;
          filter: var(--tw-darken);
        }

        .tw-drifter {
          position: absolute;
          left: 50%;
          bottom: 5%;
          width: calc(var(--tw-size) * 1.04);
          height: calc(var(--tw-size) * 1.04);
          transform: translateX(-50%);
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
          .tw-wind {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
