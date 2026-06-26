"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { NAV_LINKS } from "@/data/sections";
import { scrollToSection } from "@/lib/scrollToSection";
import { registerDoorRevealTarget } from "@/lib/doorReveal";

const GLASS_STYLE = {
  background: "rgba(244, 247, 251, 0.10)",
  WebkitBackdropFilter: "blur(16px) saturate(118%) brightness(1.02)",
  backdropFilter: "blur(16px) saturate(118%) brightness(1.02)",
  border: "0.5px solid rgba(255, 236, 214, 0.30)",
} as const;

function isPastHero() {
  const hero = document.getElementById("hero");
  if (!hero) return window.scrollY > 40;

  const heroBottom = hero.getBoundingClientRect().bottom;
  const intro = document.getElementById("intro");
  const introTop = intro?.getBoundingClientRect().top ?? Infinity;

  return heroBottom <= 0 || introTop <= 0;
}

export default function Navbar() {
  const [activeId, setActiveId] = useState("hero");
  const [pastHero, setPastHero] = useState(false);
  const logoRevealRef = useRef<HTMLButtonElement | null>(null);
  const glassRevealRef = useRef<HTMLDivElement | null>(null);

  // Reveal each navbar piece in sync with the hero's glass doors. Clipping the
  // whole nav flattened rounded corners on the glass pill; per-element clips
  // (with round on the pill) keep the final UI shape throughout the reveal.
  useEffect(() => {
    const unsubs: Array<() => void> = [];

    if (logoRevealRef.current) {
      unsubs.push(registerDoorRevealTarget(logoRevealRef.current));
    }
    if (glassRevealRef.current) {
      unsubs.push(
        registerDoorRevealTarget(glassRevealRef.current, { round: "0.375rem" }),
      );
    }

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  const onScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const past = isPastHero();
    setPastHero(past);

    if (!past) {
      setActiveId("hero");
      return;
    }

    const offset = 120;
    let current = NAV_LINKS[0]?.id ?? "intro";

    for (const link of NAV_LINKS) {
      const section = document.getElementById(link.id);
      if (!section) continue;

      const top =
        section.getBoundingClientRect().top + scrollY - offset;
      if (scrollY >= top) {
        current = link.id;
      }
    }

    setActiveId(current);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [onScroll]);

  return (
    <header
      className={`fixed inset-x-0 top-0 h-20 ${pastHero ? "z-50" : "z-50"}`}
    >
      <div className="makonis-container flex h-full items-center">
        <nav className="flex w-full items-center justify-between gap-4">
          <button
            ref={logoRevealRef}
            type="button"
            onClick={() => scrollToSection("hero")}
            className="shrink-0 transition-opacity hover:opacity-80"
            aria-label="makonis.ai home"
          >
            <Image
              src="/makonis_ai_logo.png"
              alt="makonis.ai"
              width={200}
              height={46}
              priority
              className="h-6 w-auto md:h-7"
            />
          </button>

          <div
            ref={glassRevealRef}
            className="ml-auto flex items-center gap-1 rounded-md p-1 lg:gap-2 lg:p-1.5"
            style={GLASS_STYLE}
          >
            <ul className="hidden items-center  gap-0.5 md:flex lg:gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(link.id)}
                    className={`rounded-full px-3 py-1.5 text-sm text-white transition-opacity duration-200 lg:px-3.5 ${
                      activeId === link.id
                        ? "font-medium opacity-100"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => scrollToSection("exit-door", { block: "end" })}
              className="flex shrink-0 items-center gap-2 rounded-md bg-black  text-sm text-white transition-opacity hover:opacity-90 md:px-4 md:py-3"
            >
              Contact Us
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full bg-white"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  className="h-2.5 w-2.5 text-black"
                >
                  <path
                    d="M6 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
