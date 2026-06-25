"use client";
import { useEffect, useRef, useState, useCallback } from "react";

type Weather = "clear" | "cloudy" | "rain" | "storm" | "snow" | "fog";
type Particles = "auto" | "none" | "rain" | "storm" | "snow" | "fog";

type RainParticle = { rain: 1; x: number; y: number; len: number; spd: number };
type SnowParticle = { snow: 1; x: number; y: number; r: number; spd: number; sway: number; sw: number };
type FogParticle = { fog: 1; x: number; y: number; w: number; h: number; spd: number; op: number };
type StarParticle = { star: 1; x: number; y: number; r: number; tw: number; tws: number };
type WeatherParticle = RainParticle | SnowParticle | FogParticle | StarParticle;

const PLACES = [
  { label: "India · Bengaluru", lat: 12.97, lon: 77.59 },
  { label: "UK · London", lat: 51.51, lon: -0.13 },
  { label: "Iceland · Reykjavík", lat: 64.15, lon: -21.94 },
  { label: "UAE · Dubai", lat: 25.2, lon: 55.27 },
  { label: "Japan · Tokyo", lat: 35.68, lon: 139.69 },
  { label: "Singapore", lat: 1.35, lon: 103.82 },
  { label: "Australia · Sydney", lat: -33.87, lon: 151.21 },
] as const;

const WEATHERS: Weather[] = ["clear", "cloudy", "rain", "storm", "snow", "fog"];

/* ===== LOOK CONFIG — tweak colors/sizes here ===== */
const CONFIG = {
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
    clear: { tint: null, mix: 0, darken: 1.0, light: 0.88, particles: "auto" as Particles },
    cloudy: { tint: "#8a96a8", mix: 0.36, darken: 0.93, light: 0.38, particles: "none" as Particles },
    rain: { tint: "#4a6880", mix: 0.52, darken: 0.85, light: 0, particles: "rain" as Particles },
    storm: { tint: "#283848", mix: 0.62, darken: 0.68, light: 0, particles: "storm" as Particles },
    snow: { tint: "#b8c8e0", mix: 0.4, darken: 0.96, light: 0.18, particles: "snow" as Particles },
    fog: { tint: "#a8b4c0", mix: 0.5, darken: 0.92, light: 0, particles: "fog" as Particles },
  } as Record<Weather, { tint: string | null; mix: number; darken: number; light: number; particles: Particles }>,
  sun: { color: "#fff6d8", glow: "#ffd070", radius: 30 },
  moon: { color: "#f0f4ff", glow: "#a8b8ff", radius: 19 },
  horizon: 0.72,
  topPad: 0.12,
};

/* ===== color helpers ===== */
const parseHex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (a: number[]) =>
  "#" + a.map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("");
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
const lerpHex = (a: string[], b: string[], t: number) =>
  a.map((c, i) => toHex(mix(parseHex(c), parseHex(b[i]), t)));

function baseSky(hour: number): string[] {
  const k = CONFIG.skyKeyframes;
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
function applyWeather(stops: string[], w: Weather): string[] {
  const cfg = CONFIG.weather[w];
  return stops.map((hex) => {
    let c = parseHex(hex);
    if (cfg.tint) c = mix(c, parseHex(cfg.tint), cfg.mix);
    c = c.map((v) => v * cfg.darken);
    return toHex(c);
  });
}
const daylight = (h: number) => Math.max(0, Math.sin(((h - 6) / 12) * Math.PI));

type LocationOverride = { lat: number; lon: number; city: string };

function weatherApiUrl(
  units: "metric" | "imperial",
  loc?: LocationOverride | null,
): string {
  const base = `/api/weather?units=${units}`;
  if (loc) {
    return `${base}&lat=${loc.lat}&lon=${loc.lon}&city=${encodeURIComponent(loc.city)}`;
  }
  return base;
}

function resolveLiveWeatherUrl(units: "metric" | "imperial"): Promise<string> {
  const base = weatherApiUrl(units);
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      resolve(base);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve(`${base}&lat=${coords.latitude}&lon=${coords.longitude}`),
      () => resolve(base),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 600_000 },
    );
  });
}

/* ===== control panel ===== */
function ControlPanel({
  hour,
  weather,
  locationKey,
  customLat,
  customLon,
  onTimeChange,
  onWeatherChange,
  onPlaceChange,
  onCustomLatChange,
  onCustomLonChange,
  onApplyCustom,
  onLive,
}: {
  hour: number;
  weather: Weather;
  locationKey: string;
  customLat: string;
  customLon: string;
  onTimeChange: (h: number) => void;
  onWeatherChange: (w: Weather) => void;
  onPlaceChange: (key: string) => void;
  onCustomLatChange: (v: string) => void;
  onCustomLonChange: (v: string) => void;
  onApplyCustom: () => void;
  onLive: () => void;
}) {
  const [open, setOpen] = useState(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCollapseTimer = () => {
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
      collapseTimer.current = null;
    }
  };

  const scheduleCollapse = () => {
    clearCollapseTimer();
    collapseTimer.current = setTimeout(() => setOpen(false), 400);
  };

  useEffect(() => () => clearCollapseTimer(), []);

  const hh = String(Math.floor(hour)).padStart(2, "0");
  const mm = String(Math.round((hour - Math.floor(hour)) * 60)).padStart(2, "0");

  return (
    <div
      className={`wb-panel${open ? " wb-panel-open" : ""}`}
      onMouseEnter={() => {
        clearCollapseTimer();
        setOpen(true);
      }}
      onMouseLeave={scheduleCollapse}
    >
      <button
        type="button"
        className="wb-panel-tab"
        aria-expanded={open}
        aria-label="Weather controls"
        onClick={() => setOpen((o) => !o)}
      >
        ◀
      </button>
      <div className="wb-panel-body">
        <div className="wb-row">
          <span>Time</span>
          <input
            type="range"
            min={0}
            max={24}
            step={0.1}
            value={hour}
            onChange={(e) => onTimeChange(+e.target.value)}
          />
          <span className="wb-clock">
            {hh}:{mm}
          </span>
        </div>

        <div className="wb-row wb-wrap">
          {WEATHERS.map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={weather === w}
              onClick={() => onWeatherChange(w)}
            >
              {w}
            </button>
          ))}
        </div>

        <div className="wb-row wb-col">
          <label className="wb-label" htmlFor="wb-place">
            Location
          </label>
          <select
            id="wb-place"
            className="wb-select"
            value={locationKey}
            onChange={(e) => onPlaceChange(e.target.value)}
          >
            <option value="live">Current location</option>
            {PLACES.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
            <option value="custom">Custom lat / lon</option>
          </select>
        </div>

        {locationKey === "custom" && (
          <div className="wb-row wb-wrap">
            <input
              className="wb-input"
              type="text"
              inputMode="decimal"
              placeholder="Lat"
              value={customLat}
              onChange={(e) => onCustomLatChange(e.target.value)}
            />
            <input
              className="wb-input"
              type="text"
              inputMode="decimal"
              placeholder="Lon"
              value={customLon}
              onChange={(e) => onCustomLonChange(e.target.value)}
            />
            <button type="button" onClick={onApplyCustom}>
              Apply
            </button>
          </div>
        )}

        <div className="wb-row">
          <button type="button" className="wb-live" onClick={onLive}>
            Live
          </button>
        </div>
      </div>

      <style jsx>{`
        .wb-panel {
          position: fixed;
          right: 0;
          top: 50%;
          z-index: 9999;
          display: flex;
          align-items: stretch;
          transform: translateY(-50%) translateX(calc(100% - 30px));
          transition: transform 0.28s ease;
          font: 12px system-ui, sans-serif;
          color: #fff;
        }
        .wb-panel-open {
          transform: translateY(-50%) translateX(0);
        }
        .wb-panel-tab {
          flex-shrink: 0;
          width: 30px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-right: none;
          border-radius: 10px 0 0 10px;
          background: rgba(10, 14, 28, 0.55);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: #fff;
          cursor: pointer;
          font-size: 10px;
          padding: 0;
          writing-mode: vertical-rl;
          letter-spacing: 0.06em;
        }
        .wb-panel-body {
          width: 240px;
          display: grid;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 14px 0 0 14px;
          background: rgba(10, 14, 28, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-right: none;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .wb-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .wb-col {
          flex-direction: column;
          align-items: stretch;
        }
        .wb-wrap {
          flex-wrap: wrap;
        }
        .wb-row input[type="range"] {
          flex: 1;
          accent-color: #fff;
        }
        .wb-clock {
          font-variant-numeric: tabular-nums;
          min-width: 42px;
          text-align: right;
        }
        .wb-label {
          font-size: 11px;
          opacity: 0.7;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .wb-select,
        .wb-input {
          width: 100%;
          padding: 6px 8px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: rgba(0, 0, 0, 0.25);
          color: #fff;
          font: inherit;
        }
        .wb-input {
          flex: 1;
          min-width: 60px;
        }
        button {
          color: #fff;
          background: transparent;
          cursor: pointer;
          font: inherit;
          padding: 5px 9px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.22);
        }
        button[aria-pressed="true"] {
          background: rgba(255, 255, 255, 0.22);
          border-color: rgba(255, 255, 255, 0.5);
        }
        .wb-live {
          width: 100%;
          padding: 7px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.12);
        }
      `}</style>
    </div>
  );
}

/* ===== component ===== */
const NEUTRAL_HOUR = 12;

function skyGradient(hour: number, weather: Weather): string {
  const stops = applyWeather(baseSky(hour), weather);
  return skyGradientFromStops(stops);
}

function skyGradientFromStops(stops: string[]): string {
  return [
    `radial-gradient(ellipse 85% 42% at 50% 0%, ${stops[1]}38 0%, transparent 52%)`,
    `linear-gradient(180deg, ${stops[0]} 0%, ${stops[1]} 52%, ${stops[2]} 100%)`,
  ].join(", ");
}

function blendedSkyStops(hour: number, from: Weather, to: Weather, blend: number): string[] {
  const stopsFrom = applyWeather(baseSky(hour), from);
  const stopsTo = applyWeather(baseSky(hour), to);
  return lerpHex(stopsFrom, stopsTo, blend);
}

const INITIAL_SKY_BG = skyGradient(NEUTRAL_HOUR, "clear");

export default function WeatherBackground({
  controls = process.env.NODE_ENV !== "production",
  units = "metric",
}: {
  controls?: boolean;
  units?: "metric" | "imperial";
}) {
  const [mounted, setMounted] = useState(false);
  const [weather, setWeather] = useState<Weather>("clear");
  const [hour, setHour] = useState<number>(NEUTRAL_HOUR);
  const [liveTime, setLiveTime] = useState(true);
  const [weatherLocked, setWeatherLocked] = useState(false);
  const [locationOverride, setLocationOverride] = useState<LocationOverride | null>(null);
  const [locationKey, setLocationKey] = useState("live");
  const [customLat, setCustomLat] = useState("");
  const [customLon, setCustomLon] = useState("");

  const targetHourRef = useRef(NEUTRAL_HOUR);
  const displayedHourRef = useRef(NEUTRAL_HOUR);
  const weatherRef = useRef(weather);
  const fromWeatherRef = useRef<Weather>("clear");
  const toWeatherRef = useRef<Weather>("clear");
  const blendRef = useRef(1);
  const needsParticleRebuildRef = useRef(false);
  const prevWeatherTargetRef = useRef<Weather | null>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const locationOverrideRef = useRef(locationOverride);
  const weatherLockedRef = useRef(weatherLocked);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    weatherRef.current = weather;
    locationOverrideRef.current = locationOverride;
    weatherLockedRef.current = weatherLocked;
  }, [weather, locationOverride, weatherLocked]);

  useEffect(() => {
    if (prevWeatherTargetRef.current === null) {
      prevWeatherTargetRef.current = weather;
      fromWeatherRef.current = weather;
      toWeatherRef.current = weather;
      blendRef.current = 1;
      return;
    }
    if (prevWeatherTargetRef.current === weather) return;
    fromWeatherRef.current = toWeatherRef.current;
    toWeatherRef.current = weather;
    blendRef.current = 0;
    needsParticleRebuildRef.current = true;
    prevWeatherTargetRef.current = weather;
  }, [weather]);

  const notifyLocation = useCallback(() => {
    window.dispatchEvent(new Event("wb:location"));
  }, []);

  const loadWeather = useCallback(
    async (opts?: { forceLive?: boolean; loc?: LocationOverride | null }) => {
      if (weatherLockedRef.current && !opts?.forceLive) return;
      try {
        const loc = opts?.loc !== undefined ? opts.loc : locationOverrideRef.current;
        const url = loc
          ? weatherApiUrl(units, loc)
          : await resolveLiveWeatherUrl(units);
        const r = await fetch(url, { cache: "no-store" });
        const d = await r.json();
        const w = (d.scene === "night" ? "clear" : d.scene) as Weather;
        if (!weatherLockedRef.current || opts?.forceLive) setWeather(w);
      } catch {
        /* keep last scene */
      }
    },
    [units],
  );

  useEffect(() => {
    loadWeather();
    const id = setInterval(() => loadWeather(), 5 * 60_000);
    return () => clearInterval(id);
  }, [loadWeather]);

  useEffect(() => {
    if (!liveTime) return;
    const tick = () => {
      const d = new Date();
      const h = d.getHours() + d.getMinutes() / 60;
      targetHourRef.current = h;
      setHour(h);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [liveTime]);

  const applyLocation = useCallback(
    (loc: LocationOverride | null, key: string) => {
      setLocationOverride(loc);
      setLocationKey(key);
      setWeatherLocked(false);
      weatherLockedRef.current = false;
      loadWeather({ loc, forceLive: true });
      notifyLocation();
    },
    [loadWeather, notifyLocation],
  );

  const handlePlaceChange = (key: string) => {
    if (key === "live") {
      applyLocation(null, "live");
      return;
    }
    if (key === "custom") {
      setLocationKey("custom");
      return;
    }
    const place = PLACES.find((p) => p.label === key);
    if (place) {
      applyLocation({ lat: place.lat, lon: place.lon, city: place.label }, key);
    }
  };

  const handleApplyCustom = () => {
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    applyLocation({ lat, lon, city: "Custom" }, "custom");
  };

  const handleLive = () => {
    setLiveTime(true);
    setWeatherLocked(false);
    weatherLockedRef.current = false;
    setLocationOverride(null);
    locationOverrideRef.current = null;
    setLocationKey("live");
    setCustomLat("");
    setCustomLon("");
    const d = new Date();
    const h = d.getHours() + d.getMinutes() / 60;
    targetHourRef.current = h;
    setHour(h);
    loadWeather({ forceLive: true, loc: null });
    notifyLocation();
  };

  // canvas engine — RAF eases displayed hour toward target and drives sky + sun/moon
  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current!,
      flash = flashRef.current!,
      sky = skyRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const blendStep = reduce ? 0.06 : 0.02;
    let W = 0,
      H = 0,
      raf = 0,
      lt = 0;
    let particlesFrom: WeatherParticle[] = [];
    let particlesTo: WeatherParticle[] = [];
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    const buildParticles = (w: Weather): WeatherParticle[] => {
      const kind = CONFIG.weather[w].particles;
      const out: WeatherParticle[] = [];
      if (kind === "rain" || kind === "storm")
        for (let i = 0; i < (kind === "storm" ? 270 : 170); i++)
          out.push({
            rain: 1,
            x: rnd(0, W),
            y: rnd(0, H),
            len: rnd(11, 22),
            spd: rnd(8, 14),
          });
      if (kind === "snow")
        for (let i = 0; i < 115; i++)
          out.push({
            snow: 1,
            x: rnd(0, W),
            y: rnd(0, H),
            r: rnd(1.2, 3.2),
            spd: rnd(0.5, 1.5),
            sway: rnd(0, 6.28),
            sw: rnd(0.01, 0.025),
          });
      if (kind === "fog")
        for (let i = 0; i < 6; i++)
          out.push({
            fog: 1,
            x: rnd(-200, W),
            y: rnd(H * 0.1, H * 0.52),
            w: rnd(240, 440),
            h: rnd(75, 125),
            spd: rnd(0.12, 0.32),
            op: rnd(0.09, 0.17),
          });
      if (kind === "auto")
        for (let i = 0; i < 125; i++)
          out.push({
            star: 1,
            x: rnd(0, W),
            y: rnd(0, H * 0.85),
            r: rnd(0.35, 1.3),
            tw: rnd(0, 6.28),
            tws: rnd(0.015, 0.045),
          });
      return out;
    };

    const rebuildParticleSets = () => {
      particlesFrom = buildParticles(fromWeatherRef.current);
      particlesTo = buildParticles(toWeatherRef.current);
    };

    const resize = () => {
      W = canvas.width = innerWidth;
      H = canvas.height = innerHeight;
      rebuildParticleSets();
    };

    const drawLight = (lightStrength: number) => {
      if (lightStrength <= 0) return;
      const h = displayedHourRef.current,
        dl = daylight(h);
      const horizon = H * CONFIG.horizon,
        top = H * CONFIG.topPad;
      const isDay = dl > 0.04;
      const body = isDay ? CONFIG.sun : CONFIG.moon;
      let p: number, alt: number;
      if (isDay) {
        p = (h - 6) / 12;
        alt = dl;
      } else {
        p = h >= 18 ? (h - 18) / 12 : (h + 6) / 12;
        alt = Math.sin(p * Math.PI);
      }
      const x = (0.1 + 0.8 * p) * W,
        y = top + (1 - alt) * (horizon - top),
        r = body.radius;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 6);
      const gl = parseHex(body.glow);
      g.addColorStop(0, `rgba(${gl.join(",")},${0.42 * lightStrength})`);
      g.addColorStop(0.5, `rgba(${gl.join(",")},${0.1 * lightStrength})`);
      g.addColorStop(1, `rgba(${gl.join(",")},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 6, 0, 6.28);
      ctx.fill();
      ctx.globalAlpha = lightStrength;
      ctx.fillStyle = body.color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 6.28);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const drawParticleSet = (
      particles: WeatherParticle[],
      opacity: number,
      hour: number,
    ) => {
      if (opacity <= 0.004) return;
      const starFade = Math.max(0, 1 - daylight(hour) * 1.6);
      for (const p of particles) {
        if ("rain" in p) {
          ctx.globalAlpha = opacity;
          ctx.strokeStyle = "rgba(190,210,255,.42)";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 2, p.y + p.len);
          ctx.stroke();
          p.y += p.spd * opacity;
          p.x -= opacity;
          if (p.y > H) {
            if (Math.random() < opacity) {
              p.y = -p.len;
              p.x = rnd(0, W);
            }
          }
        } else if ("fog" in p) {
          ctx.globalAlpha = opacity;
          const cg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.w / 2);
          cg.addColorStop(0, `rgba(210,214,220,${p.op})`);
          cg.addColorStop(1, "rgba(210,214,220,0)");
          ctx.fillStyle = cg;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.w / 2, p.h / 2, 0, 0, 6.28);
          ctx.fill();
          p.x += p.spd * opacity;
          if (p.x - p.w / 2 > W) {
            if (Math.random() < opacity) p.x = -p.w / 2;
          }
        } else if ("star" in p) {
          const starOp = opacity * starFade;
          if (starOp > 0.02) {
            p.tw += p.tws;
            ctx.globalAlpha = starOp;
            ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.abs(Math.sin(p.tw)) * 0.45})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, 6.28);
            ctx.fill();
          }
        } else if ("snow" in p) {
          ctx.globalAlpha = opacity * 0.72;
          ctx.fillStyle = "rgb(255,255,255)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r ?? 1, 0, 6.28);
          ctx.fill();
          p.sway += p.sw;
          p.y += p.spd * opacity;
          p.x += Math.sin(p.sway) * 0.6 * opacity;
          if (p.y > H) {
            if (Math.random() < opacity) {
              p.y = -5;
              p.x = rnd(0, W);
            }
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    const stormIntensity = (from: Weather, to: Weather, blend: number) => {
      const fromStorm = CONFIG.weather[from].particles === "storm" ? 1 - blend : 0;
      const toStorm = CONFIG.weather[to].particles === "storm" ? blend : 0;
      return fromStorm + toStorm;
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);

      const target = targetHourRef.current;
      let displayed = displayedHourRef.current;
      let delta = ((target - displayed + 36) % 24) - 12;
      if (delta === -12) delta = 12;
      if (Math.abs(delta) <= 0.004) {
        displayed = target;
      } else {
        displayed += delta * 0.1;
        displayed = (displayed + 24) % 24;
      }
      displayedHourRef.current = displayed;

      if (needsParticleRebuildRef.current) {
        rebuildParticleSets();
        needsParticleRebuildRef.current = false;
      }

      let blend = blendRef.current;
      if (blend < 1) {
        blend = Math.min(1, blend + blendStep);
        blendRef.current = blend;
      }
      if (blend >= 1) {
        fromWeatherRef.current = toWeatherRef.current;
        if (particlesFrom.length > 0) particlesFrom = [];
      }

      const fromW = fromWeatherRef.current;
      const toW = toWeatherRef.current;
      const stops = blendedSkyStops(displayed, fromW, toW, blend);
      sky.style.background = skyGradientFromStops(stops);

      const lightFrom = CONFIG.weather[fromW].light;
      const lightTo = CONFIG.weather[toW].light;
      const lightStrength = lightFrom + (lightTo - lightFrom) * blend;

      ctx.clearRect(0, 0, W, H);
      drawLight(lightStrength);

      const outOpacity = 1 - blend;
      const inOpacity = blend;
      if (outOpacity > 0.004) drawParticleSet(particlesFrom, outOpacity, displayed);
      if (inOpacity > 0.004 || blend >= 1) {
        drawParticleSet(particlesTo, blend >= 1 ? 1 : inOpacity, displayed);
      }

      const storm = stormIntensity(fromW, toW, blend);
      if (storm > 0.05 && !reduce) {
        lt--;
        if (lt <= 0 && Math.random() < 0.01 * storm) {
          flash.style.transition = "none";
          flash.style.opacity = String(0.55 * storm);
          requestAnimationFrame(() => {
            flash.style.transition = "opacity .6s ease";
            flash.style.opacity = "0";
          });
          lt = 60;
        }
      }
    };

    resize();
    addEventListener("resize", resize);
    loop();
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, [mounted]);

  return (
    <>
      <div ref={skyRef} className="wb-sky" style={{ background: INITIAL_SKY_BG }} />
      <canvas ref={canvasRef} className="wb-fx" />
      <div ref={flashRef} className="wb-flash" />

      {controls && (
        <ControlPanel
          hour={hour}
          weather={weather}
          locationKey={locationKey}
          customLat={customLat}
          customLon={customLon}
          onTimeChange={(h) => {
            setLiveTime(false);
            targetHourRef.current = h;
            setHour(h);
          }}
          onWeatherChange={(w) => {
            setWeatherLocked(true);
            weatherLockedRef.current = true;
            setWeather(w);
          }}
          onPlaceChange={handlePlaceChange}
          onCustomLatChange={setCustomLat}
          onCustomLonChange={setCustomLon}
          onApplyCustom={handleApplyCustom}
          onLive={handleLive}
        />
      )}

      <style jsx>{`
        .wb-sky {
          position: fixed;
          inset: 0;
          z-index: -3;
        }
        .wb-fx {
          position: fixed;
          inset: 0;
          z-index: -2;
          pointer-events: none;
        }
        .wb-flash {
          position: fixed;
          inset: 0;
          z-index: -2;
          background: #fff;
          opacity: 0;
          pointer-events: none;
        }
      `}</style>
    </>
  );
}
