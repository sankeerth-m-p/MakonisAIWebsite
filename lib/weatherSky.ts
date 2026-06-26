export type Weather = "clear" | "cloudy" | "rain" | "storm" | "snow" | "fog";

export const SKY_CONFIG = {
  skyKeyframes: [
    { h: 0, c: ["#060a18", "#0e1630", "#1a2450"] },
    { h: 5, c: ["#1a2050", "#3a3868", "#8a5878"] },
    { h: 7, c: ["#4a68b8", "#e88878", "#ffc898"] },
    { h: 12, c: ["#2878f0", "#5cb0ff", "#b8e4ff"] },
    { h: 17, c: ["#3a68b8", "#e89058", "#ffc088"] },
    { h: 19, c: ["#2830a0", "#a05088", "#e07858"] },
    { h: 21, c: ["#0c1238", "#182848", "#283868"] },
    { h: 24, c: ["#060a18", "#0e1630", "#1a2450"] },
  ] as { h: number; c: string[] }[],
  weather: {
    clear: { tint: null, mix: 0, darken: 1.0, light: 0.88, particles: "auto" as const },
    cloudy: { tint: "#8a96a8", mix: 0.36, darken: 0.93, light: 0.38, particles: "none" as const },
    rain: { tint: "#4a6880", mix: 0.52, darken: 0.85, light: 0, particles: "rain" as const },
    storm: { tint: "#283848", mix: 0.62, darken: 0.68, light: 0, particles: "storm" as const },
    snow: { tint: "#b8c8e0", mix: 0.4, darken: 0.96, light: 0.18, particles: "snow" as const },
    fog: { tint: "#a8b4c0", mix: 0.5, darken: 0.92, light: 0, particles: "fog" as const },
  } as Record<
    Weather,
    { tint: string | null; mix: number; darken: number; light: number; particles: string }
  >,
  sun: { color: "#fff6d8", glow: "#ffd070", radius: 30 },
  moon: { color: "#f0f4ff", glow: "#a8b8ff", radius: 19 },
  horizon: 0.72,
  topPad: 0.12,
};

const parseHex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (a: number[]) =>
  "#" + a.map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("");
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
const lerpHex = (a: string[], b: string[], t: number) =>
  a.map((c, i) => toHex(mix(parseHex(c), parseHex(b[i]), t)));

export function baseSky(hour: number): string[] {
  const k = SKY_CONFIG.skyKeyframes;
  let lo = k[0],
    hi = k[k.length - 1];
  for (let i = 0; i < k.length - 1; i++) {
    if (hour >= k[i].h && hour <= k[i + 1].h) {
      lo = k[i];
      hi = k[i + 1];
      break;
    }
  }
  const t = (hour - lo.h) / (hi.h - lo.h || 1);
  return lerpHex(lo.c, hi.c, t);
}

export function applyWeather(stops: string[], w: Weather): string[] {
  const cfg = SKY_CONFIG.weather[w];
  return stops.map((hex) => {
    let c = parseHex(hex);
    if (cfg.tint) c = mix(c, parseHex(cfg.tint), cfg.mix);
    c = c.map((v) => v * cfg.darken);
    return toHex(c);
  });
}

export function skyGradientFromStops(stops: string[]): string {
  return [
    `radial-gradient(ellipse 85% 42% at 50% 0%, ${stops[1]}38 0%, transparent 52%)`,
    `linear-gradient(180deg, ${stops[0]} 0%, ${stops[1]} 52%, ${stops[2]} 100%)`,
  ].join(", ");
}

/** Linear sky only — no top radial glow (use when a separate moon image is shown). */
export function skyGradientLinearFromStops(stops: string[]): string {
  return `linear-gradient(180deg, ${stops[0]} 0%, ${stops[1]} 52%, ${stops[2]} 100%)`;
}

export function skyGradient(hour: number, weather: Weather): string {
  return skyGradientFromStops(applyWeather(baseSky(hour), weather));
}

export function skyGradientLinear(hour: number, weather: Weather): string {
  return skyGradientLinearFromStops(applyWeather(baseSky(hour), weather));
}

export function daylight(h: number): number {
  return Math.max(0, Math.sin(((h - 6) / 12) * Math.PI));
}

export function parseHexColor(h: string): number[] {
  return parseHex(h);
}

/** Clear sky at midnight — linear gradient only (moon is a separate image). */
export const MIDNIGHT_CLEAR_SKY = skyGradientLinear(0, "clear");
