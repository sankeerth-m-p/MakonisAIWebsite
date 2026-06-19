import { SECTION_GRADIENT_CLASS as gradient } from "@/data/gradients";
import ProcessStepsAccordion from "@/components/sections/ProcessStepsAccordion";

export default function ProcessSection() {
  return (
    <section id="process" className={`${gradient.process} py-20 md:py-28 lg:py-32`}>
      <div className="makonis-container">
        <div className="grid items-stretch gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-24">
          <div className="relative aspect-[4/5] w-full overflow-hidden md:aspect-[3/4] lg:aspect-auto lg:min-h-[500px] lg:h-full">
            <div className="process-lab-visual absolute inset-0" />
            <div className="absolute inset-0 flex items-center justify-center border border-white/10 bg-black/20">
              <p className="uppercase">Lab visual</p>
            </div>
          </div>

          <div className="flex flex-col">
            <h2>From concept to creation in 3 steps</h2>
            <ProcessStepsAccordion />
          </div>
        </div>
      </div>
    </section>
  );
}
