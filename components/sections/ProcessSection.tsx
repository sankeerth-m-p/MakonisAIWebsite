"use client";

import Image from "next/image";
import { useState } from "react";

import ParallaxFloatGroup from "@/components/ui/ParallaxFloatGroup";
import { SECTION_GRADIENT_CLASS as gradient } from "@/data/gradients";
import { PROCESS_STEPS } from "@/data/sections";
import { SNAP_SECTION_CLASS } from "@/lib/sectionSnap";

const PROCESS_IMAGES = [
  "/process/AI_Assess%20readiness%20.webp",
  "/process/AI_Engineer%20and%20integrate.webp",
  "/process/Deploy%26Scale.webp",
];

const PARALLAX_SHIFT = 80;
const ACTIVE_CENTER_SHIFT = 40;

export default function ProcessSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const currentImageIndex = activeIndex === null ? 0 : activeIndex;

  const centerIndex = (PROCESS_STEPS.length - 1) / 2;
  const activeCenterTranslate =
    activeIndex === null || centerIndex === 0
      ? 0
      : ((centerIndex - activeIndex) / centerIndex) * ACTIVE_CENTER_SHIFT;

  return (
    <section
      id="process"
      className={`${gradient.process} ${SNAP_SECTION_CLASS} flex overflow-visible pb-5`}
    >
      <div className="makonis-container flex flex-1 flex-col justify-between">
        <ParallaxFloatGroup
          shift={PARALLAX_SHIFT}
          className="flex flex-1 flex-col justify-between"
        >
          <div className="flex flex-wrap items-end justify-between gap-8 pt-10">
            <h2 className="font-bold">
              From concept to creation
              <br />
              three steps is all it takes.
            </h2>
          </div>

          <div className="grid flex-1 gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-start lg:gap-10">
            <div className="relative z-0 flex h-full flex-col justify-center gap-10 md:gap-12">
              <div className="relative aspect-[5/3] w-[94%] overflow-hidden">
                <Image
                  src={PROCESS_IMAGES[currentImageIndex] ?? PROCESS_IMAGES[0]}
                  alt={PROCESS_STEPS[currentImageIndex]?.title ?? "Process visual"}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center transition-opacity duration-200"
                />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(21,130,161,0.18)_0%,rgba(32,32,40,0.12)_42%,rgba(99,40,46,0.22)_100%)]" />
                <div
                  className="absolute inset-0 opacity-70"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px)",
                    backgroundSize: "56px 56px",
                    maskImage:
                      "linear-gradient(to bottom, rgba(0,0,0,0.65), rgba(0,0,0,0.05))",
                    WebkitMaskImage:
                      "linear-gradient(to bottom, rgba(0,0,0,0.65), rgba(0,0,0,0.05))",
                  }}
                  aria-hidden
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
              </div>
            </div>

            <div
              className="relative z-10 h-full"
              onMouseLeave={() => setActiveIndex(null)}
            >
              <ol
                className="flex min-h-[360px] flex-col transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ transform: `translateY(${activeCenterTranslate}px)` }}
              >
                {PROCESS_STEPS.map((step, index) => {
                  const isActive = activeIndex === index;

                  return (
                    <li
                      key={step.step}
                      className={`${index > 0 ? "border-t border-white/15 mt-4 md:mt-6 pt-4 md:pt-6" : ""} flex flex-col overflow-hidden transition-[flex-grow,padding,margin] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                        isActive ? "flex-[2.35] py-6 md:py-7" : "flex-[0.95] py-4 md:py-5"
                      }`}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        className="flex w-full items-start gap-4 text-left md:gap-5"
                      >
                        <span
                          className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 md:h-12 md:w-12 ${
                            isActive
                              ? "border-[#1F97D0] bg-[#1F97D0]/22 text-white"
                              : "border-white/25 bg-white/5 text-white/85"
                          }`}
                        >
                          {step.step}
                        </span>

                        <span className="min-w-0 flex-1">
                          <h3 className="font-bold w-md transition-all duration-300">
                            {step.title}
                          </h3>
                        </span>
                      </button>

                      <div
                        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                          isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden pl-[3.25rem] pt-4 md:pl-[4.1rem]">
                          <p className="max-w-lg">{step.description}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </ParallaxFloatGroup>
      </div>
    </section>
  );
}
