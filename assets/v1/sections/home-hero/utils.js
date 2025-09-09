// assets/v1/sections/home-hero/utils.js

/** Normalize category/text labels (lowercase + trimmed) */
export function normalize(t) {
  return (t || "").trim().toLowerCase();
}

/** Media/connection preferences */
export const prefersReducedMotion =
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const prefersReducedData = navigator.connection?.saveData || false;
