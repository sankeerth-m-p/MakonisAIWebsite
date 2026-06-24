import { IMPACT_CARDS } from "@/data/sections";

export const HERO_VIDEO_SRC = "/temp%20hero4.webm";
export const LOGO_SRC = "/makonis_ai_logo.png";

export const PROCESS_IMAGES = [
  "/process/AI_Assess%20readiness%20.webp",
  "/process/AI_Engineer%20and%20integrate.webp",
  "/process/Deploy%26Scale.webp",
] as const;

const TAKEOFF_FRAME_COUNT = 27;
const SITTING_FRAME_COUNT = 33;
const FLYING_FRAME_COUNT = 8;

function pad(n: number) {
  return String(n).padStart(4, "0");
}

export function getButterflyFrameUrls(): string[] {
  const urls: string[] = [];
  for (let i = 0; i < TAKEOFF_FRAME_COUNT; i++) {
    urls.push(`/butterfly/takeoff/takeoff_frame_${pad(i)}.png`);
  }
  for (let i = 0; i < SITTING_FRAME_COUNT; i++) {
    urls.push(`/butterfly/sitting/sitting_frame_${pad(i)}.png`);
  }
  for (let i = 0; i < FLYING_FRAME_COUNT; i++) {
    urls.push(`/butterfly/flying/flying_frame_${pad(i)}.png`);
  }
  return urls;
}

export function getAllImageUrls(): string[] {
  return [
    LOGO_SRC,
    ...PROCESS_IMAGES,
    ...IMPACT_CARDS.map((card) => card.image),
    ...getButterflyFrameUrls(),
  ];
}
