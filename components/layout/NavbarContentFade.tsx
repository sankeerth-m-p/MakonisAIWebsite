"use client";

import { useEffect } from "react";
import { updateAllNavbarContentFades } from "@/lib/navbarContentFade";

export default function NavbarContentFade() {
  useEffect(() => {
    let frame = 0;

    const refresh = () => {
      frame = 0;
      updateAllNavbarContentFades();
    };

    const onScroll = () => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(refresh);
    };

    refresh();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return null;
}
