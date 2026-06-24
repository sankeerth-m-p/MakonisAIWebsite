import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import PreloaderGate from "@/components/preloader/PreloaderGate";
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

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-preloader-serif",
  display: "swap",
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
      className={`${interDisplay.variable} ${magistralLight.variable} ${playfair.variable}`}
      style={gradientCssVars()}
      suppressHydrationWarning
    >
      <Script id="scroll-reset" strategy="beforeInteractive">
        {`if("scrollRestoration" in history)history.scrollRestoration="manual";window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body.scrollTop=0;`}
      </Script>
      <body
        className="isolate min-h-screen overflow-x-clip"
        suppressHydrationWarning
      >
        <PreloaderGate>
          <WeatherBackground />
          <div className="relative z-0">{children}</div>
        </PreloaderGate>
      </body>
    </html>
  );
}
