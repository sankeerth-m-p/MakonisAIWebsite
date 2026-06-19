import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "makonis-white": "#FFFFFF",
        "makonis-dark": "#1D1C21",
        "makonis-gray": "#7D7D7D",
        "makonis-blue": "#142D55",
        "makonis-lightblue": "#1C99BA",
      },
      fontFamily: {
        makonis: ["var(--font-makonis)", "sans-serif"],
      },
      maxWidth: {
        "7xl": "1280px",
        "8xl": "1440px",
      },
      borderRadius: {
        makonis: "0.5rem",
        "makonis-plus": "0.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
