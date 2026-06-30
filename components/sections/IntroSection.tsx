import ParallaxFloatGroup from "@/components/ui/ParallaxFloatGroup";
import { SECTION_GRADIENT_CLASS as gradient } from "@/data/gradients";

export default function IntroSection() {
  return (
    <div id="intro" className={`${gradient.intro} h-[100vh] flex flex-col justify-center`}>
      <section className="relative flex h-screen flex-col justify-end overflow-hidden pb-24 md:pb-32 lg:pb-40">
        <div className="makonis-container relative z-10">
          <ParallaxFloatGroup className="mx-auto max-w-3xl text-center">
            <h2 className="mt-6">
              We are the engine behind your AI transformation.
            </h2>
            <p className="mx-auto mt-8 max-w-2xl">
              We empower businesses to harness the full potential of artificial
              intelligence — bridging the gap between cutting-edge technology
              and real-world business outcomes.
            </p>
          </ParallaxFloatGroup>
        </div>
      </section>
    </div>
  );
}
