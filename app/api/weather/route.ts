import { NextRequest, NextResponse } from "next/server";
import {
  codeToScene,
  codeToText,
  type WeatherResult,
  type Units,
} from "@/lib/weather";

export const dynamic = "force-dynamic";

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

export async function GET(req: NextRequest) {
  const units: Units =
    (req.nextUrl.searchParams.get("units") as Units) || "metric";
  const tempUnit = units === "imperial" ? "fahrenheit" : "celsius";
  const windUnit = units === "imperial" ? "mph" : "kmh";

  const fallback: WeatherResult = {
    scene: "clear",
    city: "",
    country: "",
    temperature: null,
    apparentTemperature: null,
    humidity: null,
    windSpeed: null,
    weatherCode: null,
    conditionText: "Clear sky",
    isDay: true,
    units,
  };

  try {
    const sp = req.nextUrl.searchParams;
    const qLat = sp.get("lat");
    const qLon = sp.get("lon");

    const loc =
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

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
      `&current=weather_code,is_day,temperature_2m,apparent_temperature,` +
      `relative_humidity_2m,wind_speed_10m&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}` +
      `&timezone=auto`;
    const r = await fetch(url, { next: { revalidate: 60 } });
    const d = await r.json();
    const c = d.current;
    const isDay = c.is_day === 1;

    const result: WeatherResult = {
      scene: codeToScene(c.weather_code, isDay),
      city: loc.city,
      country: loc.country,
      temperature: Math.round(c.temperature_2m),
      apparentTemperature: Math.round(c.apparent_temperature),
      humidity: Math.round(c.relative_humidity_2m),
      windSpeed: Math.round(c.wind_speed_10m),
      weatherCode: c.weather_code,
      conditionText: codeToText(c.weather_code),
      isDay,
      units,
    };
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(fallback);
  }
}
