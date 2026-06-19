import { SECTION_GRADIENT_CLASS as gradient } from "@/data/gradients";

export default function WhyAISection() {
  return (
    <section id="why-ai" className={`${gradient.whyAi} py-24 md:py-32 lg:py-40`}>
      <div className="makonis-container">
        <div className="mx-auto max-w-3xl text-center">
          <h2>
            Why AI? Because the future belongs to those who dare to dream.
          </h2>
          <p className="mx-auto mt-8 max-w-2xl">
            Artificial intelligence is transforming every industry. At Makonis,
            we help you navigate this landscape and harness AI&apos;s potential
            to drive meaningful, lasting results for your business.
          </p>
        </div>
      </div>

      <footer className="makonis-container mt-24 border-t border-white/10 pt-8 md:mt-32">
        <p className="text-center">
          &copy; {new Date().getFullYear()} Makonis. All rights reserved.
        </p>
      </footer>
    </section>
  );
}
