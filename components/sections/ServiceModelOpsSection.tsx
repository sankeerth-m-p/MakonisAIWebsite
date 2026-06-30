import BoatScrollReveal, { BOAT_WAKE_BOTTOM_BLEED_PX } from "@/components/ui/BoatScrollReveal";
import ServiceContentLabel from "@/components/ui/ServiceContentLabel";
import { SECTION_GRADIENT_CLASS as gradient } from "@/data/gradients";

export default function ServiceModelOpsSection() {
  return (
    <div
      id="service-model-ops"
      className={`${gradient.service4} relative z-5 overflow-visible`}
      style={{
        background: "var(--gradient-service4)",
        minHeight: `calc(100vh + ${BOAT_WAKE_BOTTOM_BLEED_PX}px)`,
      }}
    >
      <section className="relative flex h-screen flex-col overflow-visible pt-24">
        <BoatScrollReveal />
        <div className="relative z-20 makonis-container flex w-full flex-col pt-[30vh] pb-10 md:pt-[28vh] lg:pt-[26vh]">
          <ServiceContentLabel
            title="AI Model Ops & Governance"
            description="Deploy, monitor, and govern AI systems with confidence and compliance."
            details={{
              heading: "AI Model Ops & Governance",
              intro:
                "We operationalize AI with strong release discipline, observability, and governance so production systems stay safe and effective.",
              points: [
                "Automated deployment pipelines for model and prompt releases across environments.",
                "Monitoring for quality, drift, latency, and usage with actionable alerting workflows.",
                "Governance controls for policy compliance, auditability, and responsible AI standards.",
              ],
            }}
          />
        </div>
      </section>
    </div>
  );
}
