import BoatScrollReveal from "@/components/ui/BoatScrollReveal";
import ServiceContentLabel from "@/components/ui/ServiceContentLabel";
import { SECTION_GRADIENT_CLASS as gradient } from "@/data/gradients";
import { SNAP_SECTION_CLASS } from "@/lib/sectionSnap";

export default function ServiceModelOpsSection() {
  return (
    <section
      id="service-model-ops"
      className={`${gradient.service4} ${SNAP_SECTION_CLASS} relative flex flex-col overflow-visible`}
      style={{ background: "var(--gradient-service4)" }}
    >
      <BoatScrollReveal />
      <div className="relative z-20 makonis-container flex w-full flex-col pt-[30vh] pb-10 md:pt-[28vh] lg:pt-[26vh]">
        <ServiceContentLabel
          title="AI Model Ops & Governance"
          description="Deploy, monitor, and govern AI systems with confidence and compliance."
        />
      </div>
    </section>
  );
}
