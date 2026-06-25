"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";

import { SECTION_GRADIENT_CLASS as gradient } from "@/data/gradients";
import { IMPACT_CARDS } from "@/data/sections";
import { SNAP_SECTION_FLOW_CLASS } from "@/lib/sectionSnap";

export default function ImpactSection() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const [progress, setProgress] = useState(0);

  const GAP = 24;

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      const visibleWidth = track.clientWidth;
      const width = (visibleWidth - GAP) / 2;
      setCardWidth(width);
      const columns = Math.ceil(IMPACT_CARDS.length / 2);
      const trackWidth = columns * width + (columns - 1) * GAP;
      setScrollDistance(Math.max(trackWidth - visibleWidth, 0));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const { top, height } = wrapper.getBoundingClientRect();
      const total = height - window.innerHeight;
      if (total <= 0) {
        setProgress(0);
        return;
      }
      setProgress(Math.min(Math.max(-top / total, 0), 1));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [scrollDistance]);

  const translateX = -progress * scrollDistance;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const card = e.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = (x - cx) / cx;
    const dy = (y - cy) / cy;

    card.style.transform = `perspective(800px) rotateX(${-dy * 2.5}deg) rotateY(${dx * 2.5}deg) scale3d(1.01, 1.01, 1.01)`;
    card.style.transition = "transform 0.08s ease-out";

    const glow = card.querySelector<HTMLSpanElement>(".card-glow");
    if (glow) {
      glow.style.left = `${x - 180}px`;
      glow.style.top = `${y - 180}px`;
    }
  }, []);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const card = e.currentTarget as HTMLElement;
    card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    card.style.transition = "transform 0.4s ease";

    const glow = card.querySelector<HTMLSpanElement>(".card-glow");
    if (glow) {
      glow.style.left = "-180px";
      glow.style.top = "-180px";
    }
  }, []);

  return (
    <section id="impact" className={`${gradient.impact} ${SNAP_SECTION_FLOW_CLASS}`}>
      <div ref={wrapperRef} style={{ height: `calc(90vh + ${scrollDistance}px + 8rem)` }}>
        <div className="sticky top-20 h-[calc(100vh-5rem)] py-8 md:py-10">
          <div className="makonis-container flex h-full min-h-0 flex-col">
            <div className="pb-8 md:pb-10">
              <h2>Where AI makes an impact</h2>
            </div>

            <div className="mt-auto min-h-0">
            <div ref={trackRef} className="h-full min-h-0">
              <div
                className="flex h-full flex-col flex-wrap content-start items-stretch transition-transform duration-75 ease-out will-change-transform"
                style={{
                  width: "max-content",
                  gap: `${GAP}px`,
                  transform: `translate3d(${translateX}px, 0, 0)`,
                }}
              >
                {IMPACT_CARDS.map((card) => (
                  <article
                    key={card.title}
                    style={
                      cardWidth
                        ? {
                            width: `${cardWidth}px`,
                            flex: `0 0 calc((100% - ${GAP}px) / 2)`,
                          }
                        : undefined
                    }
                    className="group relative shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/4 p-8 backdrop-blur-sm md:p-10"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    <span
                      className="card-glow pointer-events-none absolute h-[360px] w-[360px] rounded-full opacity-0 blur-[80px] transition-opacity duration-300 group-hover:opacity-35"
                      style={{
                        left: "-180px",
                        top: "-180px",
                        background: card.accent,
                      }}
                      aria-hidden
                    />

                    <span
                      className="absolute inset-x-0 top-0 h-0.75"
                      style={{
                        background: `linear-gradient(90deg, ${card.accent} 0%, ${card.accent}00 100%)`,
                      }}
                      aria-hidden
                    />

                    <div className="relative z-10 max-w-[60%]">
                      <h3 className="">{card.title}</h3>
                      <p className="mt-3  text-white/70">{card.description}</p>
                    </div>

                    <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 md:h-40 md:w-40">
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        sizes="160px"
                        className="object-contain object-bottom-right"
                      />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
