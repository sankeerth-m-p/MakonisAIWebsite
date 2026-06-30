"use client";

import { useEffect, useRef } from "react";

import AnimatedButton from "@/components/ui/AnimatedButton";
import ParallaxFloatGroup from "@/components/ui/ParallaxFloatGroup";
import {
  useServiceDetailsOverlay,
  type ServiceDetailContent,
} from "@/components/ui/ServiceDetailsOverlayProvider";

interface ServiceContentLabelProps {
  title: string;
  description: string;
  buttonText?: string;
  details: ServiceDetailContent;
}

export default function ServiceContentLabel({
  title,
  description,
  buttonText = "Learn More",
  details,
}: ServiceContentLabelProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const { openServiceDetails, registerServiceDetailsAnchor } =
    useServiceDetailsOverlay();

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    return registerServiceDetailsAnchor(el, details);
  }, [details, registerServiceDetailsAnchor]);

  return (
    <div ref={anchorRef}>
      <ParallaxFloatGroup className="flex w-lg flex-col items-start justify-start">
        <h3>{title}</h3>

        <div className="mt-5 h-px w-full bg-white" />

        <p className="mt-8 max-w-md">{description}</p>

        <div className="mt-8">
          <AnimatedButton onClick={() => openServiceDetails(details)}>
            {buttonText}
          </AnimatedButton>
        </div>
      </ParallaxFloatGroup>
    </div>
  );
}
