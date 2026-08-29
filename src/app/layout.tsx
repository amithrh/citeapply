import type { Metadata } from "next";
import type { ReactNode } from "react";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
