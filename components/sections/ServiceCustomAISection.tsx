import CloudCircuitOverlay from "@/components/CloudCircuitOverlay";
import NightSkyStarsOverlay from "@/components/NightSkyStarsOverlay";
import AircraftScrollReveal from "@/components/ui/AircraftScrollReveal";
import ParallaxFloatGroup from "@/components/ui/ParallaxFloatGroup";
import ServiceContentLabel from "@/components/ui/ServiceContentLabel";
import { SECTION_GRADIENT_CLASS as gradient } from "@/data/gradients";
import type { PathKeyframe } from "@/lib/scrollPath";

const CUSTOM_AI_AIRCRAFT_PATH: PathKeyframe[] = [
  { t: 0.0, x: 1.2, y: 0.38 },
  { t: 0.5, x: 0.5, y: 0.38 },
  { t: 1.0, x: -0.2, y: 0.38 },
];

export default function ServiceCustomAISection() {
  return (
    <div
      id="service-custom-ai"
      className={`${gradient.service1} relative h-[120vh] overflow-visible  flex flex-col justify-center`}
      style={{ background: "var(--gradient-service1)" }}
    >
      <NightSkyStarsOverlay
        heightPercent={30}
        position="bottom"
        className="translate-y-6"
      /> <ParallaxFloatGroup className="relative z-10 makonis-container flex flex-col items-start">
      <h2 className="max-w-2xl ">
        Smart AI Services for
        <br />
        Intelligent Business Outcomes
      </h2>
    </ParallaxFloatGroup>
      <section className="relative  isolate z-10 flex h-screen flex-col overflow-visible pb-10 pt-24">
        <div className="pointer-events-none absolute right-0 top-0 z-5 h-full w-[60%]">
          <CloudCircuitOverlay position="absolute" bottomFade={0.28} />
        </div>
        <AircraftScrollReveal path={CUSTOM_AI_AIRCRAFT_PATH} />
       

        <div className="relative z-10 makonis-container mt-auto flex w-full flex-col justify-end pb-10">
          <ServiceContentLabel
            title="Custom AI Solutions"
            description="Tailored AI models designed to solve your unique business challenges."
            details={{
              heading: "Custom AI Solutions",
              intro:
                "We design AI that fits your workflows, users, and business outcomes instead of forcing generic models into critical processes.",
              points: [
                "Use-case mapping and feasibility analysis to identify high-value AI opportunities.",
                "Model design and fine-tuning tailored to your data, quality targets, and constraints.",
                "Secure integration into existing platforms with measurable KPIs from day one.",
              ],
            }}
          />
        </div>
      </section>
    </div>
  );
}
