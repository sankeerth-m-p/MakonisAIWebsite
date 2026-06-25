"use client";

import { useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { shouldEnableCssSnap } from "@/lib/sectionSnap";

gsap.registerPlugin(ScrollTrigger);

type LenisRootProps = {
  children: ReactNode;
};

export default function LenisRoot({ children }: LenisRootProps) {
  useEffect(() => {
    const syncSnapClass = () => {
      document.documentElement.classList.toggle(
        "snap-enabled",
        shouldEnableCssSnap(),
      );
    };

    const onScroll = () => {
      ScrollTrigger.update();
      syncSnapClass();
    };

    const onContentReady = () => {
      window.scrollTo(0, 0);
      ScrollTrigger.refresh();
      syncSnapClass();
    };

    const onResize = () => {
      ScrollTrigger.refresh();
      syncSnapClass();
    };

    if (!document.documentElement.classList.contains("preloader-active")) {
      onContentReady();
    } else {
      window.addEventListener("makonis:content-ready", onContentReady, {
        once: true,
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("makonis:content-ready", onContentReady);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.documentElement.classList.remove("snap-enabled");
    };
  }, []);

  return children;
}
