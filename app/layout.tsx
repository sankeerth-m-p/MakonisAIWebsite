import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const interDisplay = Inter({
  subsets: ["latin"],
  axes: ["opsz"],
  weight: "variable",
  variable: "--font-makonis",
  display: "swap",
});

const ffClan = localFont({
  src: "../public/fonts/hero font/FF Clan OT Black.otf",
  variable: "--font-makonis-heading",
  display: "block",
});

const ffClanMedium = localFont({
  src: "../public/fonts/hero font/FF Clan OT Medium.otf",
  variable: "--font-makonis-heading-medium",
  display: "block",
});

const ffClanBold = localFont({
  src: "../public/fonts/hero font/FF Clan OT Bold.otf",
  variable: "--font-makonis-heading-bold",
  display: "block",
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
      className={`${interDisplay.variable} ${ffClan.variable} ${ffClanMedium.variable} ${ffClanBold.variable} ${magistralLight.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen overflow-x-hidden bg-[var(--color-makonis-dark)]"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
