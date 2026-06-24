"use client";

import { useEffect, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Preloader from "@/components/preloader/Preloader";
import { preloadAllAssets } from "@/lib/preloadAssets";

gsap.registerPlugin(ScrollTrigger);

const EXIT_DURATION_MS = 1600;
const HOLD_AT_100_MS = 500;

function resetScrollPosition() {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

type PreloaderGateProps = {
  children: ReactNode;
};

export default function PreloaderGate({ children }: PreloaderGateProps) {
  const [mounted, setMounted] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("preloader-active");
    resetScrollPosition();

    let cancelled = false;
    let holdTimer: ReturnType<typeof setTimeout> | undefined;
    let exitTimer: ReturnType<typeof setTimeout> | undefined;
    let unmountTimer: ReturnType<typeof setTimeout> | undefined;

    void preloadAllAssets((pct) => {
      if (!cancelled) setProgress(pct);
    }).then(() => {
      if (cancelled) return;

      holdTimer = setTimeout(() => {
        resetScrollPosition();
        setContentReady(true);
        window.dispatchEvent(new Event("makonis:content-ready"));

        exitTimer = setTimeout(() => {
          setExiting(true);

          unmountTimer = setTimeout(() => {
            resetScrollPosition();
            setMounted(false);
            root.classList.remove("preloader-active");
            ScrollTrigger.refresh();
            resetScrollPosition();
          }, EXIT_DURATION_MS);
        }, 50);
      }, HOLD_AT_100_MS);
    });

    return () => {
      cancelled = true;
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(unmountTimer);
      root.classList.remove("preloader-active");
    };
  }, []);

  return (
    <>
      <div
        className={
          contentReady
            ? "preloader-content--visible"
            : "preloader-content--hidden"
        }
        aria-hidden={!contentReady}
      >
        {children}
      </div>
      {mounted && <Preloader progress={progress} exiting={exiting} />}
    </>
  );
}
