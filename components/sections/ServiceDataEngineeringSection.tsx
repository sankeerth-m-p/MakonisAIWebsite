import NightSkyStarsOverlay from "@/components/NightSkyStarsOverlay";
import JeepScrollReveal from "@/components/ui/JeepScrollReveal";
import ServiceContentLabel from "@/components/ui/ServiceContentLabel";
import { SECTION_GRADIENT_CLASS as gradient } from "@/data/gradients";

export default function ServiceDataEngineeringSection() {
  return (
    <div
      id="service-data-engineering"
      className={`${gradient.service3} relative h-[120vh] overflow-visible  flex flex-col justify-center`}
      style={{ background: "var(--gradient-service3)" }}
    >
      <NightSkyStarsOverlay
        heightPercent={20}
        position="top"
        className="-translate-y-4"
      />
      <section className="relative z-10 flex h-screen flex-col overflow-visible pt-24">
        <JeepScrollReveal />
        <div className="relative z-30 makonis-container flex w-full flex-col pt-[30vh] pb-10 md:pt-[28vh] lg:pt-[26vh]">
          <ServiceContentLabel
            title="Data Strategy & Engineering"
            description="Unlock the value of your data with actionable insights and robust pipelines."
            details={{
              heading: "Data Strategy & Engineering",
              intro:
                "We architect data foundations that transform fragmented information into governed, trusted, and decision-ready intelligence.",
              points: [
                "Modern data platform design with scalable ingestion, transformation, and orchestration.",
                "Analytics engineering for clean semantic layers, dashboards, and self-service reporting.",
                "Data quality, lineage, and governance practices that support compliance and reliability.",
              ],
            }}
          />
        </div>
      </section>
    </div>
  );
}
