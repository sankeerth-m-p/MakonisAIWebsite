import { getWeatherUrl } from "@/lib/getWeatherUrl";
import { getAllImageUrls, HERO_VIDEO_SRC } from "@/lib/siteAssets";

async function preloadImage(src: string): Promise<void> {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  try {
    await img.decode();
  } catch {
    if (!img.complete) {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      });
    }
  }
}

function preloadVideo(src: string): Promise<void> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const finish = () => {
      video.removeEventListener("loadeddata", finish);
      video.removeEventListener("error", finish);
      resolve();
    };

    video.addEventListener("loadeddata", finish);
    video.addEventListener("error", finish);
    video.src = src;
    video.load();
  });
}

async function preloadWeather(): Promise<void> {
  try {
    const url = await getWeatherUrl();
    await fetch(url, { cache: "no-store" });
  } catch {
    /* fall through — page still works with default weather */
  }
}

function waitForWindowLoad(): Promise<void> {
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    window.addEventListener("load", () => resolve(), { once: true });
  });
}

function waitForFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) {
    return Promise.resolve();
  }
  return document.fonts.ready.then(() => undefined);
}

export async function preloadAllAssets(
  onProgress: (percent: number) => void,
): Promise<void> {
  const imageUrls = getAllImageUrls();
  const tasks: Array<() => Promise<void>> = [
    waitForFonts,
    () => preloadVideo(HERO_VIDEO_SRC),
    waitForWindowLoad,
    ...imageUrls.map((src) => () => preloadImage(src)),
  ];

  // Warm weather cache in background — must not block loader dismiss
  void preloadWeather();

  let completed = 0;
  const total = tasks.length;

  const tick = () => {
    completed += 1;
    const pct = Math.min(99, Math.round((completed / total) * 100));
    onProgress(pct);
  };

  await Promise.all(
    tasks.map((task) =>
      task()
        .then(tick)
        .catch(() => tick()),
    ),
  );

  onProgress(100);
}
