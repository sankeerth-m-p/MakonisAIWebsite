import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import WeatherBackground from "@/components/WeatherBackground";
import { gradientCssVars } from "@/data/gradients";
import "./globals.css";

const interDisplay = Inter({
  subsets: ["latin"],
  axes: ["opsz"],
  weight: "variable",
  variable: "--font-makonis",
  display: "swap",
});

const magistralLight = localFont({
  src: "../public/fonts/Magistral-Light.woff2",
  variable: "--font-makonis-progress",
  display: "block",
});

export const metadata: Metadata = {
  title: "Makonis AI",
  description: "Makonis AI Website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${interDisplay.variable} ${magistralLight.variable}`}
      style={gradientCssVars()}
      suppressHydrationWarning
    >
      <body
        className="isolate min-h-screen overflow-x-clip"
        suppressHydrationWarning
      >
        <WeatherBackground />
        <div className="relative z-0">{children}</div>
      </body>
    </html>
  );
}
