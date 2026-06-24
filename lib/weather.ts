export type Scene =
  | "clear"
  | "cloudy"
  | "rain"
  | "storm"
  | "snow"
  | "fog"
  | "night";

export type Units = "metric" | "imperial";

export type SceneSource = "metar" | "open-meteo" | "fallback";

/** Slim API payload — only what WeatherBackground reads (+ debug fields). */
export interface WeatherSceneResponse {
  scene: Scene;
  sceneSource: SceneSource;
  observationAgeMinutes: number | null;
}

/** Legacy shape for WeatherPanel; extended fields are optional. */
export interface WeatherResult extends WeatherSceneResponse {
  city?: string;
  country?: string;
  temperature?: number | null;
  apparentTemperature?: number | null;
  humidity?: number | null;
  windSpeed?: number | null;
  weatherCode?: number | null;
  conditionText?: string;
  isDay?: boolean;
  units?: Units;
}

export function codeToScene(code: number, isDay: boolean): Scene {
  if (!isDay && code <= 1) return "night";
  if (code <= 1) return "clear";
  if (code <= 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 95) return "storm";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  return "rain";
}

const WMO: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers",
  81: "Showers",
  82: "Heavy showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm + hail",
  99: "Severe thunderstorm",
};

export function codeToText(code: number): string {
  return WMO[code] ?? "Unknown";
}
