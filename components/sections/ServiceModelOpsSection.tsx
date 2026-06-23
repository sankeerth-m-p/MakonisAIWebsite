import ServiceContentLabel from "@/components/ui/ServiceContentLabel";
import { SECTION_GRADIENT_CLASS as gradient } from "@/data/gradients";

export default function ServiceModelOpsSection() {
  return (
    <section
      id="service-model-ops"
      className={`${gradient.service4} relative isolate flex min-h-screen flex-col overflow-hidden`}
      style={{ background: "var(--gradient-service4)" }}
    >
      <div className="makonis-container flex w-full flex-col pt-[30vh] pb-10 md:pt-[28vh] lg:pt-[26vh]">
        <ServiceContentLabel
          title="AI Model Ops & Governance"
          description="Deploy, monitor, and govern AI systems with confidence and compliance."
        />
      </div>
    </section>
  );
}
