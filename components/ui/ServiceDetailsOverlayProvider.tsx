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
import {
  publishServicePanelOpen,
  registerServicePanelElement,
  SERVICE_PANEL_TRANSITION_MS,
  syncServicePanelMaskLayout,
} from "@/lib/servicePanelMask";

export interface ServiceDetailContent {
  heading: string;
  intro: string;
  points: string[];
}

type ServiceDetailsAnchor = {
  el: HTMLElement;
  details: ServiceDetailContent;
};

type ServiceDetailsOverlayContextValue = {
  isOpen: boolean;
  openServiceDetails: (content: ServiceDetailContent) => void;
  closeServiceDetails: () => void;
  registerServiceDetailsAnchor: (
    el: HTMLElement,
    details: ServiceDetailContent,
  ) => () => void;
};

const ServiceDetailsOverlayContext =
  createContext<ServiceDetailsOverlayContextValue | null>(null);

const frostBackdropClass =
  "bg-[rgba(244,247,251,0.12)] [backdrop-filter:blur(16px)_saturate(118%)_brightness(1.02)] [-webkit-backdrop-filter:blur(16px)_saturate(118%)_brightness(1.02)]";
function pickActiveAnchor(
  anchors: ServiceDetailsAnchor[],
): ServiceDetailContent | null {
  let best: ServiceDetailContent | null = null;
  let bestRatio = 0;

  for (const { el, details } of anchors) {
    const rect = el.getBoundingClientRect();
    if (rect.height <= 0) continue;

    const visibleTop = Math.max(rect.top, 0);
    const visibleBottom = Math.min(rect.bottom, window.innerHeight);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const ratio = visibleHeight / rect.height;

    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = details;
    }
  }

  return bestRatio >= 0.35 ? best : null;
}

export function ServiceDetailsOverlayProvider({
  children,
}: {
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLElement | null>(null);
  const hasOpenedRef = useRef(false);
  const anchorsRef = useRef<ServiceDetailsAnchor[]>([]);
  const contentRef = useRef<ServiceDetailContent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ServiceDetailContent | null>(null);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    if (!panelRef.current) return;
    return registerServicePanelElement(panelRef.current);
  }, []);

  const closeServiceDetails = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openServiceDetails = useCallback((nextContent: ServiceDetailContent) => {
    setContent(nextContent);
    setIsOpen(true);
  }, []);

  const registerServiceDetailsAnchor = useCallback(
    (el: HTMLElement, details: ServiceDetailContent) => {
      const entry: ServiceDetailsAnchor = { el, details };
      anchorsRef.current = [...anchorsRef.current, entry];

      return () => {
        anchorsRef.current = anchorsRef.current.filter((item) => item !== entry);
      };
    },
    [],
  );

  useEffect(() => {
    if (isOpen) hasOpenedRef.current = true;
    if (!isOpen && !hasOpenedRef.current) return;

    publishServicePanelOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onResize = () => {
      syncServicePanelMaskLayout();
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
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

  useEffect(() => {
    if (!isOpen) return;

    let frame = 0;

    const closeIfSectionChanged = () => {
      const active = pickActiveAnchor(anchorsRef.current);
      if (
        active &&
        contentRef.current &&
        active.heading !== contentRef.current.heading
      ) {
        closeServiceDetails();
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        closeIfSectionChanged();
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isOpen, closeServiceDetails]);

  const value = useMemo(
    () => ({
      isOpen,
      openServiceDetails,
      closeServiceDetails,
      registerServiceDetailsAnchor,
    }),
    [isOpen, openServiceDetails, closeServiceDetails, registerServiceDetailsAnchor],
  );

  return (
    <ServiceDetailsOverlayContext.Provider value={value}>
      {children}
      <div
        className={`pointer-events-none fixed inset-0 z-[70] ${
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
          } pointer-events-auto transition-transform ease-out`}
          style={{
            transitionDuration: `${SERVICE_PANEL_TRANSITION_MS}ms`,
          }}
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
