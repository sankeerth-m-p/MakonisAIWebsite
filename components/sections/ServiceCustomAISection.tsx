import NightSkyStarsOverlay from "@/components/NightSkyStarsOverlay";
import AircraftScrollReveal from "@/components/ui/AircraftScrollReveal";
import ServiceContentLabel from "@/components/ui/ServiceContentLabel";
import { SECTION_GRADIENT_CLASS as gradient } from "@/data/gradients";

export default function ServiceCustomAISection() {
  return (
    <div
      id="service-custom-ai"
      className={`${gradient.service1} h-[120vh]  flex flex-col justify-center`}
      style={{ background: "var(--gradient-service1)" }}
    >
      <section className="relative isolate flex h-screen flex-col overflow-visible pb-10 pt-24">
        <NightSkyStarsOverlay heightPercent={30} position="bottom" />
        <AircraftScrollReveal />
        <div className="relative z-10 makonis-container flex flex-col items-start">
          <h2 className="max-w-2xl pb-1">
            Smart AI Services for
            <br />
            Intelligent Business Outcomes
          </h2>
        </div>

        <div className="relative z-10 makonis-container mt-auto flex w-full flex-col justify-end pb-10">
          <ServiceContentLabel
            title="Custom AI Solutions"
            description="Tailored AI models designed to solve your unique business challenges."
          />
        </div>
      </section>
    </div>
  );
}
