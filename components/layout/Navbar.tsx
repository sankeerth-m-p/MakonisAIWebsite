"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NAV_LINKS } from "@/data/sections";
import { scrollToSection } from "@/lib/scrollToSection";

function isPastHero() {
  const hero = document.getElementById("hero");
  if (!hero) return window.scrollY > 40;

  const heroBottom = hero.getBoundingClientRect().bottom;
  const intro = document.getElementById("intro");
  const introTop = intro?.getBoundingClientRect().top ?? Infinity;

  return heroBottom <= 0 || introTop <= 0;
}

export default function Navbar() {
  const lastScrollYRef = useRef(0);
  const [showHeader, setShowHeader] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeId, setActiveId] = useState("hero");

  const onScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const previousScrollY = lastScrollYRef.current;
    const scrollDelta = scrollY - previousScrollY;
    const pastHero = isPastHero();

    setIsScrolled(pastHero);

    if (scrollY <= 12) {
      setShowHeader(true);
    } else if (Math.abs(scrollDelta) > 1) {
      setShowHeader(scrollDelta < 0);
    }

    if (!pastHero) {
      setActiveId("hero");
      lastScrollYRef.current = scrollY;
      return;
    }

    const offset = 120;
    let current = NAV_LINKS[0].id;

    for (const link of NAV_LINKS) {
      const section = document.getElementById(link.id);
      if (!section) continue;

      const top = section.offsetTop - offset;
      if (scrollY >= top) {
        current = link.id;
      }
    }

    setActiveId(current);
    lastScrollYRef.current = scrollY;
  }, []);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [onScroll]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 bg-transparent transition-transform ${
        showHeader ? "duration-150 ease-out" : "duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
      } ${
        showHeader
          ? "pointer-events-auto translate-y-0"
          : "pointer-events-none -translate-y-full"
      } text-white`}
    >
      <nav className="makonis-container flex h-16 items-center md:h-20">
        <button type="button" onClick={() => scrollToSection("hero")}>
          makonis.ai
        </button>

        <ul
          className={`ml-auto hidden items-center md:flex ${
            isScrolled
              ? "gap-0.5 rounded-full border border-white/30 bg-white/50 p-1 backdrop-blur-xl"
              : "gap-1 lg:gap-2"
          }`}
        >
          {NAV_LINKS.map((link) => (
            <li key={link.id}>
              <button
                type="button"
                onClick={() => scrollToSection(link.id)}
                className={`rounded-full px-3 py-1.5 transition-[opacity,background-color] lg:px-4 ${
                  isScrolled
                    ? activeId === link.id
                      ? "bg-white/60 text-makonis-dark"
                      : "text-makonis-dark/80 hover:bg-white/35 hover:text-makonis-dark"
                    : activeId === link.id
                      ? "opacity-100"
                      : "opacity-60 hover:opacity-100"
                }`}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
