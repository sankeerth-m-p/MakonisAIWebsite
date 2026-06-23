/**
 * Per-section gradient configuration.
 * Each section can have its own angle, colors, and custom stop positions.
 */

export interface GradientConfig {
  angle: string | number; // "to bottom", "180deg", etc.
  colors: Array<{ color: string; stop?: number }>; // stop in % (auto-evenly-spaced if omitted)
}

export const SECTION_GRADIENTS: Record<string, GradientConfig> = {
  intro: {
    angle: "180deg",
    colors: [
      { color: "rgba(217, 217, 217, 0)", stop: 0 },
      { color: "#1689AC", stop: 50.02 },
    ],
  },
  service1: {
    angle: "180deg",
    colors: [
      { color: "#1689AC", stop: 0 },
      { color: "#3C2E83", stop: 100 },
    ],
  },
  service2: {
    angle: "180deg",
    colors: [
      { color: "#3C2E83", stop: 0 },
      { color: "#9A7B83", stop: 100 },
    ],
  },
  service3: {
    angle: "180deg",
    colors: [
      { color: "#9A7B83", stop: 0 },
      { color: "#DBA879", stop: 100 },
    ],
  },
  service4: {
    angle: "180deg",
    colors: [
      { color: "#DBA879", stop: 0 },
      { color: "#36AEB3", stop: 100 },
    ],
  },
  process: {
    angle: "to bottom",
    colors: [
      { color: "#36AEB3" },
      { color: "#504742" },
      { color: "#662321" },
    ],
  },
  impact: {
    angle: "to bottom",
    colors: [
      { color: "#662321" },
      { color: "#2A3F6C" },
    ],
  },
  whyAi: {
    angle: "to bottom",
    colors: [
      { color: "#2A3F6C" },
      { color: "#0a0a0c" },
    ],
  },
} as const;

export const SECTION_GRADIENT_CLASS = {
  intro: "section-gradient-intro",
  service1: "section-gradient-service1",
  service2: "section-gradient-service2",
  service3: "section-gradient-service3",
  service4: "section-gradient-service4",
  process: "section-gradient-process",
  impact: "section-gradient-impact",
  whyAi: "section-gradient-why-ai",
} as const;

function buildGradientString(config: GradientConfig): string {
  const stops = config.colors
    .map((item, i, arr) => {
      const stop = item.stop ?? (i / (arr.length - 1)) * 100;
      return `${item.color} ${stop}%`;
    })
    .join(", ");

  return `linear-gradient(${config.angle}, ${stops})`;
}

/** CSS variables for section gradient classes — wired in app/layout.tsx */
export function gradientCssVars(): Record<string, string> {
  return {
    "--gradient-intro": buildGradientString(SECTION_GRADIENTS.intro),
    "--gradient-service1": buildGradientString(SECTION_GRADIENTS.service1),
    "--gradient-service2": buildGradientString(SECTION_GRADIENTS.service2),
    "--gradient-service3": buildGradientString(SECTION_GRADIENTS.service3),
    "--gradient-service4": buildGradientString(SECTION_GRADIENTS.service4),
    "--gradient-process": buildGradientString(SECTION_GRADIENTS.process),
    "--gradient-process-lab": `linear-gradient(to bottom, ${SECTION_GRADIENTS.process.colors[0]!.color}55, ${SECTION_GRADIENTS.process.colors[1]!.color}88)`,
    "--gradient-impact": buildGradientString(SECTION_GRADIENTS.impact),
    "--gradient-why-ai": buildGradientString(SECTION_GRADIENTS.whyAi),
  };
}
