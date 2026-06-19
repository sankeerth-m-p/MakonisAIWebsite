/**
 * Edit gradient colors here.
 * Each section only lists new colors — the last color of the previous
 * section is reused automatically so transitions stay seamless.
 */

export const GRADIENT_COLORS = {
  intro: "#1F97D0",
  services: ["#1a6fd4", "#3d2060", "#c47830", "#0d3d4a"],
  process: ["#1a2030", "#4a1528"],
  impact: ["#2a0e18", "#121218"],
  whyAi: "#0a0a0c",
} as const;

export const SECTION_GRADIENT_CLASS = {
  intro: "section-gradient-intro",
  services: "section-gradient-services",
  process: "section-gradient-process",
  impact: "section-gradient-impact",
  whyAi: "section-gradient-why-ai",
} as const;

function withBridge<T extends readonly string[]>(
  bridge: string,
  colors: T,
): string[] {
  return [bridge, ...colors];
}

function gradientStops(colors: string[]): string {
  return colors
    .map((color, i) => `${color} ${(i / (colors.length - 1)) * 100}%`)
    .join(", ");
}

/** CSS variables for section gradient classes — wired in app/layout.tsx */
export function gradientCssVars(): Record<string, string> {
  const services = withBridge(GRADIENT_COLORS.intro, GRADIENT_COLORS.services);
  const process = withBridge(services.at(-1)!, GRADIENT_COLORS.process);
  const impact = withBridge(process.at(-1)!, GRADIENT_COLORS.impact);
  const whyAi = withBridge(impact.at(-1)!, [GRADIENT_COLORS.whyAi]);

  return {
    "--gradient-intro": `linear-gradient(180deg, rgba(217, 217, 217, 0) 17.79%, ${GRADIENT_COLORS.intro} 87.02%)`,
    "--gradient-services": `linear-gradient(to bottom, ${gradientStops(services)})`,
    "--gradient-process": `linear-gradient(to bottom, ${gradientStops(process)})`,
    "--gradient-process-lab": `linear-gradient(to bottom, ${process[0]}55, ${process[1]}88)`,
    "--gradient-impact": `linear-gradient(to bottom, ${gradientStops(impact)})`,
    "--gradient-why-ai": `linear-gradient(to bottom, ${gradientStops(whyAi)})`,
  };
}
