import ParallaxFloatGroup from "@/components/ui/ParallaxFloatGroup";
import { SECTION_GRADIENT_CLASS as gradient } from "@/data/gradients";
import { SNAP_SECTION_CLASS } from "@/lib/sectionSnap";

export default function WhyAISection() {
  return (
    <section
      id="why-ai"
      className={`${gradient.whyAi} min-h-[50vh] pt-40  flex flex-col justify-center pb-24 md:pb-32 lg:pb-40`}
    >
      <div className="makonis-container">
        <ParallaxFloatGroup className="mx-auto max-w-3xl text-center">
          <h2>
            Why AI? Because the future belongs to those who dare to dream.
          </h2>
          <p className="mx-auto mt-8 max-w-2xl">
            Artificial intelligence is transforming every industry. At Makonis,
            we help you navigate this landscape and harness AI&apos;s potential
            to drive meaningful, lasting results for your business.
          </p>
        </ParallaxFloatGroup>
      </div>
    </section>
  );
}
