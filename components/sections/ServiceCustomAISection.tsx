import NightSkyStarsOverlay from "@/components/NightSkyStarsOverlay";
import ServiceContentLabel from "@/components/ui/ServiceContentLabel";
import { SECTION_GRADIENT_CLASS as gradient } from "@/data/gradients";
import { SNAP_SECTION_CLASS } from "@/lib/sectionSnap";

export default function ServiceCustomAISection() {
  return (
    <section
      id="service-custom-ai"
      className={`${gradient.service1} ${SNAP_SECTION_CLASS} relative isolate  flex flex-col overflow-hidden pb-10`}
      style={{ background: "var(--gradient-service1)" }}
    >
      <NightSkyStarsOverlay heightPercent={30} position="bottom" />
      <div className="relative z-10 makonis-container flex flex-col   items-start">
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
  );
}
