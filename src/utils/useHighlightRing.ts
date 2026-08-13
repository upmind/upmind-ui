import { clsx } from "clsx";
import { highlightRingClasses } from "../assets/styles";
import type { ClassValue } from "clsx";

/**
 * Applies the package's highlight ring to any surface: an outline in the primary
 * family, always on, marking a surface that is in a deliberate mode rather than
 * reporting a fault.
 *
 * The ring vocabulary itself stays internal — a surface composes the treatment,
 * never the class strings behind it, so there is one highlight-outline technique.
 *
 * @param classes - the surface's own classes, where it has any.
 * @returns those classes carrying the highlight ring.
 */
export function useHighlightRing(...classes: ClassValue[]): string {
  // Concatenated rather than merged through `cn`: tailwind-merge reads `outline`
  // and `outline-2` as one width group and drops the ring's style half.
  return clsx(highlightRingClasses, classes);
}
