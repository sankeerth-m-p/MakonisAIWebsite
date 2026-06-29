import NightSkyStarsOverlay from "@/components/NightSkyStarsOverlay";
import JeepScrollReveal from "@/components/ui/JeepScrollReveal";
import ServiceContentLabel from "@/components/ui/ServiceContentLabel";
import { SECTION_GRADIENT_CLASS as gradient } from "@/data/gradients";

export default function ServiceDataEngineeringSection() {
  return (
    <div
      id="service-data-engineering"
      className={`${gradient.service3} h-[120vh]  flex flex-col justify-center`}
      style={{ background: "var(--gradient-service3)" }}
    >
      <section className="relative flex h-screen flex-col overflow-visible pt-24">
        <NightSkyStarsOverlay heightPercent={20} position="top" />
        <JeepScrollReveal />
        <div className="relative z-10 makonis-container flex w-full flex-col pt-[30vh] pb-10 md:pt-[28vh] lg:pt-[26vh]">
          <ServiceContentLabel
            title="Data Strategy & Engineering"
            description="Unlock the value of your data with actionable insights and robust pipelines."
          />
        </div>
      </section>
    </div>
  );
}
