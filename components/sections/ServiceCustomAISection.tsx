import ServiceContentLabel from "@/components/ui/ServiceContentLabel";
import { SECTION_GRADIENT_CLASS as gradient } from "@/data/gradients";

export default function ServiceCustomAISection() {
  return (
    <section
      id="service-custom-ai"
      className={`${gradient.service1} relative isolate flex min-h-screen py-10 flex-col overflow-hidden`}
      style={{ background: "var(--gradient-service1)" }}
    >
      <div className="makonis-container flex flex-col items-start pt-10">
        <h2 className="max-w-2xl">
          Smart AI Services for
          <br />
          Intelligent Business Outcomes
        </h2>
      </div>

      <div className="makonis-container mt-auto flex w-full flex-col justify-end pb-10">
        <ServiceContentLabel
          title="Custom AI Solutions"
          description="Tailored AI models designed to solve your unique business challenges."
        />
      </div>
    </section>
  );
}
