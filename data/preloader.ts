export const PRELOADER_QUOTE =
  "As soon as it works, no one calls it AI anymore.";

export const PRELOADER_AUTHOR = "JOHN MCCARTHY";

export const PRELOADER_LOGO_SRC = "/makonis_ai_logo.png";

/** Matches the Makonis AI ribbon logo: lime → cyan → royal blue */
export const PRELOADER_GRADIENT_STOPS = [
  { offset: "0%", color: "#A2F960" },
  { offset: "48%", color: "#00D2FF" },
  { offset: "100%", color: "#0066FF" },
] as const;

export const PRELOADER_GRADIENT_CSS =
  "linear-gradient(135deg, #A2F960 0%, #00D2FF 48%, #0066FF 100%)";
