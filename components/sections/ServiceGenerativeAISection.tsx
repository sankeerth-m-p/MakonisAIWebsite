import ServiceContentLabel from "@/components/ui/ServiceContentLabel";
import { SECTION_GRADIENT_CLASS as gradient } from "@/data/gradients";
import { SNAP_SECTION_CLASS } from "@/lib/sectionSnap";

export default function ServiceGenerativeAISection() {
  return (
    <section
      id="service-generative-ai"
      className={`${gradient.service2} ${SNAP_SECTION_CLASS} relative isolate flex flex-col overflow-hidden`}
      style={{ background: "var(--gradient-service2)" }}
    >
      <div className="makonis-container flex w-full flex-col pt-[68vh] pb-10 md:pt-[62vh] lg:pt-[58vh]">
        <ServiceContentLabel
          title="Generative AI Development"
          description="Harness the power of Large Language Models to create content, code, and more."
        />
      </div>
    </section>
  );
}
