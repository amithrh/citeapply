"use client";

import { useEffect } from "react";

/**
 * The page's two pieces of behaviour that are about the page rather than the
 * product: sections arriving as you reach them, and the masthead taking on a
 * shade once you have left the top of the document.
 *
 * Both are deliberately additive. The reveal's hidden state is only ever
 * applied under `html[data-motion="on"]`, and that attribute is set here,
 * after mount, by JavaScript — so a reader with no JavaScript, a crawler, or a
 * failed bundle gets the fully visible page rather than a blank one. The CSS
 * that hides the sections is additionally wrapped in
 * `prefers-reduced-motion: no-preference`, so the attribute alone is not
 * enough to hide anything from a reader who has asked for less motion.
 *
 * Renders one zero-height sentinel and nothing else.
 */
export function LandingMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (typeof IntersectionObserver !== "function") return;

    const observers: IntersectionObserver[] = [];

    if (!reduced) {
      root.dataset["motion"] = "on";
      const reveals = document.querySelectorAll("[data-reveal]");
      const revealer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            (entry.target as HTMLElement).dataset["revealed"] = "";
            revealer.unobserve(entry.target);
          }
        },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
      );
      for (const node of reveals) revealer.observe(node);
      observers.push(revealer);
    }

    const sentinel = document.getElementById("scroll-sentinel");
    if (sentinel !== null) {
      const shader = new IntersectionObserver(
        ([entry]) => {
          if (entry === undefined) return;
          if (entry.isIntersecting) delete root.dataset["scrolled"];
          else root.dataset["scrolled"] = "";
        },
        { threshold: 0 },
      );
      shader.observe(sentinel);
      observers.push(shader);
    }

    return () => {
      for (const observer of observers) observer.disconnect();
      delete root.dataset["motion"];
      delete root.dataset["scrolled"];
    };
  }, []);

  return <div id="scroll-sentinel" aria-hidden="true" />;
}
