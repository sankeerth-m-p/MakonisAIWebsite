import ServiceContentLabel from "@/components/ui/ServiceContentLabel";
import { SECTION_GRADIENT_CLASS as gradient } from "@/data/gradients";

export default function ServiceDataEngineeringSection() {
  return (
    <section
      id="service-data-engineering"
      className={`${gradient.service3} relative isolate flex min-h-screen flex-col overflow-hidden`}
      style={{ background: "var(--gradient-service3)" }}
    >
      <div className="makonis-container flex w-full flex-col pt-[30vh] pb-10 md:pt-[28vh] lg:pt-[26vh]">
        <ServiceContentLabel
          title="Data Strategy & Engineering"
          description="Unlock the value of your data with actionable insights and robust pipelines."
        />
      </div>
    </section>
  );
}
