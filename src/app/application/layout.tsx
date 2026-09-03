import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * The application page is a client component and so cannot export metadata
 * itself. This gives the route its opening title — the stage the applicant
 * actually starts on — through the root layout's "%s — CiteApply" template.
 * The two later stages are reached without a navigation, so the page updates
 * `document.title` itself as the stage heading changes; that update is not
 * clobbered, because Next only writes the title on a route change.
 */
export const metadata: Metadata = {
  title: "Application",
};

export default function ApplicationLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
