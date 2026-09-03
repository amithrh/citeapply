import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader, Public_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { SiteFooter, SiteHeader } from "../ui/site/shell.tsx";

import "./globals.css";

/*
 * The faces are self-hosted at build time, so they load from this origin and
 * the strict connect/font CSP needs no exception.
 *
 * Public Sans is the civic-service face; Newsreader carries the records-office
 * register of the headings; IBM Plex Mono is reserved for literal source
 * transcriptions, handles, and hashes.
 */
const publicSans = Public_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-public-sans",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-newsreader",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: {
    default: "CiteApply synthetic aid demo",
    template: "%s — CiteApply",
  },
  description:
    "A fictional Horizon Education Aid demonstration using synthetic records only.",
  robots: {
    index: false,
    follow: false,
  },
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${newsreader.variable} ${plexMono.variable}`}
    >
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
