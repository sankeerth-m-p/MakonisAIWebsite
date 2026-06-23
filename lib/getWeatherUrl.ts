// Resolves the most accurate weather URL: GPS coords if the user allows them,
// otherwise the IP-based route. Never rejects.
let pending: Promise<string> | null = null;

export function getWeatherUrl(
  units: "metric" | "imperial" = "metric",
): Promise<string> {
  if (pending) return pending;

  const base = `/api/weather?units=${units}`;
  pending = new Promise((resolve) => {
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

  return pending;
}
