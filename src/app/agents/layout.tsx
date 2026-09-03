import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * The boundary lists on this route are read from the same client module the
 * consent disclosure uses, so the page itself is a client component and cannot
 * export metadata. This route layout gives it its title and description.
 */
export const metadata: Metadata = {
  title: "For agents",
  description:
    "How an assistant works inside the CiteApply synthetic aid demonstration, and where it is stopped.",
};

export default function AgentsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
