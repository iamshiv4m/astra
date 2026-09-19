import type { Metadata } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import { DemoProvider } from "@/lib/store";
import { AppChrome } from "@/components/app-chrome";
import "./globals.css";

const display = localFont({ src: "../../public/fonts/gloock.ttf", variable: "--font-brand", display: "swap", weight: "400" });
const ui = localFont({ src: "../../public/fonts/manrope.ttf", variable: "--font-ui", display: "swap", weight: "200 800" });

export const metadata: Metadata = {
  title: { default: "ASTRA — Clarity, one conversation away", template: "%s | ASTRA" },
  description: "A thoughtfully imagined astrology consultation experience. Find your astrologer, choose your moment, and make space for a personal conversation. Interactive demo.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${ui.variable}`}><body><DemoProvider><Suspense fallback={<div className="loading-state" role="status">Opening ASTRA...</div>}><AppChrome>{children}</AppChrome></Suspense></DemoProvider></body></html>;
}
