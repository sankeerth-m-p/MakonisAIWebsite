"use client";

import { useState } from "react";
import { PROCESS_STEPS } from "@/data/sections";

export default function ProcessStepsAccordion() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <ol
      className="mt-12 flex min-h-[380px] flex-col md:mt-14 md:min-h-[500px]"
      onMouseLeave={() => setActiveIndex(null)}
    >
      {PROCESS_STEPS.map((step, index) => {
        const isActive = activeIndex === index;

        return (
          <li
            key={step.step}
            className={`flex flex-col overflow-hidden border-t border-white/15 transition-[flex-grow,padding] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              isActive ? "flex-[2.8] py-6 md:py-8" : "flex-1 py-4 md:py-5"
            }`}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => setActiveIndex(isActive ? null : index)}
          >
            <div className="flex gap-5 md:gap-6">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 md:h-12 md:w-12 ${
                  isActive
                    ? "border-[#1F97D0] bg-[#1F97D0]/25"
                    : "border-[#1F97D0]/40 bg-[#1F97D0]/10"
                }`}
              >
                {step.step}
              </div>

              <div className="min-w-0 flex-1">
                <h3>{step.title}</h3>

                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-md pt-3">{step.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
