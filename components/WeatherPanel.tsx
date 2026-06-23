"use client";

import { useEffect, useState } from "react";
import type { WeatherResult } from "@/lib/weather";
import { getWeatherUrl } from "@/lib/getWeatherUrl";

const ICON: Record<string, string> = {
  clear: "☀️",
  cloudy: "☁️",
  rain: "🌧️",
  storm: "⛈️",
  snow: "❄️",
  fog: "🌫️",
  night: "🌙",
};

export default function WeatherPanel({
  units = "metric",
  pollMinutes = 5,
}: {
  units?: "metric" | "imperial";
  pollMinutes?: number;
}) {
  const [w, setW] = useState<WeatherResult | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const sp = new URLSearchParams(window.location.search);
        const url =
          sp.get("lat") && sp.get("lon")
            ? `/api/weather?units=${units}&lat=${sp.get("lat")}&lon=${sp.get("lon")}&city=${encodeURIComponent(sp.get("city") || "")}`
            : await getWeatherUrl(units);
        const r = await fetch(url, { cache: "no-store" });
        const d: WeatherResult = await r.json();
        if (alive) {
          setW(d);
          setError(false);
        }
      } catch {
        if (alive) setError(true);
      }
    };
    load();
    const onLoc = () => load();
    window.addEventListener("wb:location", onLoc);
    const id =
      pollMinutes > 0 ? setInterval(load, pollMinutes * 60_000) : undefined;
    return () => {
      alive = false;
      window.removeEventListener("wb:location", onLoc);
      if (id) clearInterval(id);
    };
  }, [units, pollMinutes]);

  const deg = units === "imperial" ? "°F" : "°C";
  const wind = units === "imperial" ? "mph" : "km/h";

  return (
    <section aria-label="Current weather" className="panel">
      {error && <p className="muted">Weather unavailable right now.</p>}
      {!error && !w && <p className="muted">Loading weather…</p>}
      {!error && w && (
        <>
          <div className="top">
            <span className="icon" aria-hidden>
              {ICON[w.scene] ?? "🌡️"}
            </span>
            <div>
              <p className="temp">
                {w.temperature ?? "--"}
                <span>{deg}</span>
              </p>
              <p className="cond">{w.conditionText}</p>
            </div>
          </div>
          <p className="place">
            {w.city
              ? `${w.city}${w.country ? ", " + w.country : ""}`
              : "Your location"}
          </p>
          <dl className="grid">
            <div>
              <dt>Feels like</dt>
              <dd>
                {w.apparentTemperature ?? "--"}
                {deg}
              </dd>
            </div>
            <div>
              <dt>Humidity</dt>
              <dd>{w.humidity ?? "--"}%</dd>
            </div>
            <div>
              <dt>Wind</dt>
              <dd>
                {w.windSpeed ?? "--"} {wind}
              </dd>
            </div>
          </dl>
        </>
      )}
      <style jsx>{`
        .panel {
          max-width: 360px;
          padding: 24px 26px;
          border-radius: 22px;
          color: #fff;
          background: rgba(20, 24, 40, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22);
        }
        .top {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .icon {
          font-size: 46px;
          line-height: 1;
        }
        .temp {
          margin: 0;
          font-size: 48px;
          font-weight: 600;
          line-height: 1;
        }
        .temp span {
          font-size: 22px;
          font-weight: 400;
          opacity: 0.8;
          margin-left: 2px;
        }
        .cond {
          margin: 4px 0 0;
          opacity: 0.9;
        }
        .place {
          margin: 14px 0 0;
          opacity: 0.7;
          font-size: 14px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin: 18px 0 0;
        }
        .grid dt {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.6;
          margin: 0;
        }
        .grid dd {
          margin: 3px 0 0;
          font-size: 16px;
          font-weight: 500;
        }
        .muted {
          margin: 0;
          opacity: 0.75;
        }
      `}</style>
    </section>
  );
}
