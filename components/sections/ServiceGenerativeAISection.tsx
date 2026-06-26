import NightSkyStarsOverlay from "@/components/NightSkyStarsOverlay";
import GlobeCometArcs from "@/components/ui/globe";
import NetworkGlobe from "@/components/ui/networkglobe";
import ServiceContentLabel from "@/components/ui/ServiceContentLabel";
import UfoScrollReveal from "@/components/ui/UfoScrollReveal";
import { SECTION_GRADIENT_CLASS as gradient } from "@/data/gradients";
import type { PathKeyframe } from "@/lib/scrollPath";

/**
 * UFO flight path — smooth curve A→B→C, tied to scroll (reversible).
 *   A (t=0.0)  start position          — entering from top section
 *   B (t=0.5)  middle                  — section fully in view
 *   C (t=1.0)  end                     — scrolled forward / leaving
 * Scrolling forward runs A→B→C; scrolling back reverses C→B→A.
 * Edit with `editorMode` on UfoScrollReveal, then paste here.
 */
const UFO_PATH: PathKeyframe[] = [
  { t: 0.0, x: 0.003, y: -0.04 }, // A — start
  { t: 0.125, x: 0.203, y: 0.218 },
  { t: 0.25, x: 0.363, y: 0.268 },
  { t: 0.375, x: 0.45, y: 0.3 },
  { t: 0.5, x: 0.578, y: 0.41 }, // B — middle
  { t: 0.75, x: 0.8, y: 0.839 },
  { t: 1.0, x: 0.993, y: 1 }, // C — end
];

export default function ServiceGenerativeAISection() {
  return (
    <section
      id="service-generative-ai"
      className={`${gradient.service2} snap-section relative flex min-h-screen flex-col overflow-visible pt-24`}
      style={{ background: "var(--gradient-service2)" }}
    >
      <NightSkyStarsOverlay /> 
      <UfoScrollReveal
        src="/ufo.webm"
        height="40vh"
        path={UFO_PATH}
        progressMode="enterExit"
      />
      <div className="pointer-events-none absolute top-[12%] right-[5%] z-5 translate-x-1/2 -translate-y-1/3">
        <GlobeCometArcs size={400} className="opacity-80" />
      </div>
      <div className="pointer-events-none absolute inset-0 z-1">
        <div className="absolute left-[40%] top-[45%] z-10 -translate-x-1/2 -translate-y-1/2">
          <NetworkGlobe size={300} rotationSpeed={1.4} className="opacity-80" />
        </div>
        <div className="absolute left-[50%] top-[70%] z-20 -translate-x-1/2 -translate-y-1/2">
          <NetworkGlobe size={150} rotationSpeed={1} className="opacity-80" />
        </div>
        <div className="absolute left-[25%] top-[50%] z-20 -translate-x-1/2 -translate-y-1/2">
          <NetworkGlobe size={100} rotationSpeed={3} className="opacity-80" />
        </div>
      </div>
      <div className="relative z-10 makonis-container mt-auto flex w-full flex-col pb-10">
        <ServiceContentLabel
          title="Generative AI Development"
          description="Harness the power of Large Language Models to create content, code, and more."
        />
      </div>
    </section>
  );
}
