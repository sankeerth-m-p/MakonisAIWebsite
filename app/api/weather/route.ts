import { NextRequest, NextResponse } from "next/server";
import {
  codeToScene,
  type Scene,
  type WeatherSceneResponse,
} from "@/lib/weather";

export const dynamic = "force-dynamic";

const METAR_MAX_AGE_SEC = 75 * 60;
const WX_TOKEN =
  /^(-|\+|VC)?(MI|PR|BC|DR|BL|SH|TS|FZ)*(DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS)+$/;

const SCENE_RANK: Record<Scene, number> = {
  clear: 0,
  night: 0,
  cloudy: 1,
  fog: 2,
  snow: 3,
  rain: 4,
  storm: 5,
};

const FALLBACK_RESPONSE: WeatherSceneResponse = {
  scene: "clear",
  sceneSource: "fallback",
  observationAgeMinutes: null,
};

type ResolvedLocation = {
  lat: number;
  lon: number;
  city: string;
  country: string;
};

type MetarObservation = {
  lat: number;
  lon: number;
  obsTime: number;
  rawOb: string;
};

async function resolveLocation(req: NextRequest) {
  const vLat = req.headers.get("x-vercel-ip-latitude");
  const vLon = req.headers.get("x-vercel-ip-longitude");
  if (vLat && vLon) {
    return {
      lat: parseFloat(vLat),
      lon: parseFloat(vLon),
      city: decodeURIComponent(req.headers.get("x-vercel-ip-city") ?? ""),
      country: decodeURIComponent(
        req.headers.get("x-vercel-ip-country") ?? "",
      ),
    };
  }

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  try {
    const r = await fetch(`https://ipwho.is/${ip}`, { cache: "no-store" });
    const d = await r.json();
    if (d?.success)
      return {
        lat: d.latitude,
        lon: d.longitude,
        city: d.city,
        country: d.country_code,
      };
  } catch {
    // fall through
  }
  return null;
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function sceneFromMetar(rawOb: string): Scene {
  const tokens = rawOb.split(/\s+/);
  let worst: Scene = "clear";

  for (const token of tokens) {
    if (!WX_TOKEN.test(token)) continue;
    let s: Scene;
    if (token.includes("TS")) s = "storm";
    else if (token.includes("RA") || token.includes("DZ") || token.includes("SH"))
      s = "rain";
    else if (token.includes("SN") || token.includes("SG")) s = "snow";
    else if (
      token.includes("FG") ||
      token.includes("BR") ||
      token.includes("HZ") ||
      token.includes("FU")
    )
      s = "fog";
    else s = "clear";

    if (SCENE_RANK[s] > SCENE_RANK[worst]) worst = s;
  }

  if (SCENE_RANK[worst] === 0 && /\b(BKN|OVC)\b/.test(rawOb)) return "cloudy";
  return worst;
}

function parseMetarObs(item: Record<string, unknown>): MetarObservation | null {
  const lat = Number(item.lat);
  const lon = Number(item.lon);
  const rawOb = typeof item.rawOb === "string" ? item.rawOb : "";
  const obsTime = Number(item.obsTime);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !rawOb || !obsTime)
    return null;
  return { lat, lon, obsTime, rawOb };
}

function pickNearestFreshMetar(
  items: Record<string, unknown>[],
  loc: ResolvedLocation,
): MetarObservation | null {
  const nowSec = Date.now() / 1000;
  let best: MetarObservation | null = null;
  let bestDist = Infinity;

  for (const item of items) {
    const obs = parseMetarObs(item);
    if (!obs) continue;
    const ageSec = nowSec - obs.obsTime;
    if (ageSec < 0 || ageSec > METAR_MAX_AGE_SEC) continue;

    const dist = haversineKm(loc.lat, loc.lon, obs.lat, obs.lon);
    if (dist < bestDist) {
      bestDist = dist;
      best = obs;
    }
  }

  return best;
}

async function fetchSceneFromMetar(
  loc: ResolvedLocation,
): Promise<WeatherSceneResponse | null> {
  const south = loc.lat - 0.8;
  const west = loc.lon - 0.8;
  const north = loc.lat + 0.8;
  const east = loc.lon + 0.8;
  const url =
    `https://aviationweather.gov/api/data/metar` +
    `?bbox=${south},${west},${north},${east}&format=json`;

  const r = await fetch(url, {
    headers: { "User-Agent": "my-weather-app/1.0" },
    next: { revalidate: 600 },
  });
  if (!r.ok) return null;

  const data: unknown = await r.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const obs = pickNearestFreshMetar(data as Record<string, unknown>[], loc);
  if (!obs) return null;

  const ageMinutes = Math.round((Date.now() / 1000 - obs.obsTime) / 60);
  return {
    scene: sceneFromMetar(obs.rawOb),
    sceneSource: "metar",
    observationAgeMinutes: ageMinutes,
  };
}

async function fetchSceneFromOpenMeteo(
  loc: ResolvedLocation,
): Promise<WeatherSceneResponse | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
    `&current=weather_code,precipitation,is_day&timezone=auto`;

  const r = await fetch(url, { next: { revalidate: 60 } });
  if (!r.ok) return null;

  const d = await r.json();
  const c = d?.current;
  if (!c) return null;

  const isDay = c.is_day === 1;
  let scene = codeToScene(c.weather_code, isDay);
  const precip = Number(c.precipitation ?? 0);
  if ((scene === "rain" || scene === "storm") && precip <= 0.1) {
    scene = "cloudy";
  }

  return {
    scene,
    sceneSource: "open-meteo",
    observationAgeMinutes: null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const qLat = sp.get("lat");
    const qLon = sp.get("lon");

    const loc: ResolvedLocation =
      qLat && qLon
        ? {
            lat: +qLat,
            lon: +qLon,
            city: decodeURIComponent(sp.get("city") || ""),
            country: "",
          }
        : ((await resolveLocation(req)) ?? {
            lat: 12.97,
            lon: 77.59,
            city: "Bengaluru",
            country: "IN",
          });

    try {
      const metar = await fetchSceneFromMetar(loc);
      if (metar) return NextResponse.json(metar);
    } catch {
      // fall through to Open-Meteo
    }

    try {
      const om = await fetchSceneFromOpenMeteo(loc);
      if (om) return NextResponse.json(om);
    } catch {
      // fall through to hard fallback
    }

    return NextResponse.json(FALLBACK_RESPONSE);
  } catch {
    return NextResponse.json(FALLBACK_RESPONSE);
  }
}
