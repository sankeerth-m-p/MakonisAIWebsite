import Image from "next/image";
import { SECTION_GRADIENT_CLASS as gradient } from "@/data/gradients";
import { SERVICES } from "@/data/sections";

const SERVICE_IMAGES = [
  "/images/services/custom-ai.png",
  "/images/services/generative-ai.png",
  "/images/services/data-engineering.png",
  "/images/services/model-ops.png",
];

export default function ServicesSection() {
  return (
    <section id="services" className={`${gradient.services} flex flex-col`}>
      <article className="relative min-h-[40vh] overflow-hidden lg:min-h-[45vh]">
        <div className="makonis-container flex h-full min-h-[inherit] flex-col items-center justify-center py-16 md:py-20 lg:py-24 text-center">
          <h2 className="max-w-2xl">
            Smart AI Services for<br />Intelligent Business Outcomes
          </h2>
        </div>
      </article>

      {SERVICES.map((service, index) => (
        <article
          key={service.id}
          id={service.id}
          className="relative min-h-[70vh] overflow-hidden lg:min-h-[85vh]"
        >
          {index === 1 && (
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
          )}

          <div className="makonis-container flex h-full min-h-[inherit] flex-col items-center justify-center gap-10 py-16 md:py-20 lg:py-24">
            <div className="flex w-full flex-col items-start md:grid md:grid-cols-2 md:gap-12 lg:gap-20">
              <div className="flex flex-col justify-center">
                <h3>{service.title}</h3>
                <p className="mt-5 max-w-md">{service.description}</p>
                <button
                  type="button"
                  className="btn mt-8 w-fit rounded-full border border-white px-8 py-3.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Learn More</span>
                </button>
              </div>

              <div className="relative aspect-[4/3] w-full overflow-hidden md:aspect-auto md:h-[min(55vh,480px)]">
                <Image
                  src={SERVICE_IMAGES[index]}
                  alt={service.title}
                  fill
                  className="object-cover object-center"
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
