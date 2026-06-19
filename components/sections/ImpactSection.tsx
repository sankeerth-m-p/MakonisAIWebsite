import { SECTION_GRADIENT_CLASS as gradient } from "@/data/gradients";
import { IMPACT_CARDS } from "@/data/sections";

export default function ImpactSection() {
  return (
    <section id="impact" className={`${gradient.impact} py-20 md:py-28 lg:py-32`}>
      <div className="makonis-container">
        <h2 className="text-center">The AI Impact</h2>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:gap-6">
          {IMPACT_CARDS.map((card) => (
            <article
              key={card.title}
              className="relative min-h-[180px] rounded-xl border border-white/10 bg-black/25 p-8 md:min-h-[200px] md:p-10"
            >
              <h3>{card.title}</h3>
              <p className="mt-3 max-w-xs">{card.description}</p>
              <div
                className="absolute bottom-5 right-5 h-8 w-8 rounded-full border border-[#1F97D0]/50 bg-[#1F97D0]/20 md:bottom-6 md:right-6 md:h-10 md:w-10"
                aria-hidden
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
