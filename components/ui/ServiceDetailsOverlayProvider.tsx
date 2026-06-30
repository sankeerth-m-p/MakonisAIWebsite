"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { publishServicePanelSeam } from "@/lib/servicePanelMask";

export interface ServiceDetailContent {
  heading: string;
  intro: string;
  points: string[];
}

type ServiceDetailsOverlayContextValue = {
  openServiceDetails: (content: ServiceDetailContent) => void;
  closeServiceDetails: () => void;
};

const ServiceDetailsOverlayContext =
  createContext<ServiceDetailsOverlayContextValue | null>(null);

const frostBackdropClass =
  "bg-[rgba(244,247,251,0.12)] [backdrop-filter:blur(16px)_saturate(118%)_brightness(1.02)] [-webkit-backdrop-filter:blur(16px)_saturate(118%)_brightness(1.02)]";
const PANEL_TRANSITION_MS = 500;

export function ServiceDetailsOverlayProvider({
  children,
}: {
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLElement | null>(null);
  const hasOpenedRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ServiceDetailContent | null>(null);

  const closeServiceDetails = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openServiceDetails = useCallback((nextContent: ServiceDetailContent) => {
    setContent(nextContent);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (isOpen) hasOpenedRef.current = true;

    const syncSeam = () => {
      const panel = panelRef.current;
      if (!panel) {
        publishServicePanelSeam(null);
        return;
      }
      const rect = panel.getBoundingClientRect();
      const clampedLeft = Math.max(0, Math.min(window.innerWidth, rect.left));
      publishServicePanelSeam(clampedLeft);
    };

    if (!isOpen && !hasOpenedRef.current) {
      publishServicePanelSeam(null);
      return;
    }

    let frame = 0;
    const closingUntil = isOpen
      ? Number.POSITIVE_INFINITY
      : performance.now() + PANEL_TRANSITION_MS + 80;

    const tick = () => {
      syncSeam();
      if (isOpen || performance.now() < closingUntil) {
        frame = window.requestAnimationFrame(tick);
      } else {
        publishServicePanelSeam(null);
      }
    };

    frame = window.requestAnimationFrame(tick);

    const onResize = () => {
      syncSeam();
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeServiceDetails();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeServiceDetails]);

  const value = useMemo(
    () => ({ openServiceDetails, closeServiceDetails }),
    [openServiceDetails, closeServiceDetails],
  );

  return (
    <ServiceDetailsOverlayContext.Provider value={value}>
      {children}
      <div
        className={`pointer-events-none fixed inset-0 z-[60] ${
          isOpen ? "opacity-100" : "opacity-0"
        } transition-opacity duration-300 ease-out`}
        aria-hidden={!isOpen}
      >
        <button
          type="button"
          aria-label="Close details panel"
          onClick={closeServiceDetails}
          className={`absolute inset-0 ${
            isOpen ? "pointer-events-auto" : "pointer-events-none"
          } bg-transparent`}
        />
        <aside
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={content?.heading ?? "Service details"}
          className={`absolute top-0 right-0 h-full w-1/2 text-white ${frostBackdropClass} ${
            isOpen ? "translate-x-0" : "translate-x-full"
          } pointer-events-auto transition-transform duration-500 ease-out`}
        >
          {content ? (
            <div className="flex h-full flex-col overflow-y-auto px-[clamp(1.2rem,3vw,2.2rem)] py-[clamp(1.2rem,3.5vw,2.6rem)]">
              <div className="flex items-center justify-between gap-4">
                <p className="eyebrow text-xs tracking-[0.2em] text-white/80">
                  Service Details
                </p>
                <button
                  type="button"
                  onClick={closeServiceDetails}
                  className="text-sm text-white/85 transition-opacity hover:opacity-70"
                >
                  Close
                </button>
              </div>
              <h3 className="mt-6 max-w-[18ch]">{content.heading}</h3>
              <div className="mt-5 h-px w-full bg-white/90" />
              <p className="mt-6 max-w-[44ch] text-white/95">{content.intro}</p>
              <div className="mt-8 space-y-4">
                {content.points.map((point) => (
                  <p key={point} className="max-w-[46ch] text-white/88">
                    {point}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </ServiceDetailsOverlayContext.Provider>
  );
}

export function useServiceDetailsOverlay() {
  const context = useContext(ServiceDetailsOverlayContext);
  if (!context) {
    throw new Error(
      "useServiceDetailsOverlay must be used within ServiceDetailsOverlayProvider",
    );
  }
  return context;
}
