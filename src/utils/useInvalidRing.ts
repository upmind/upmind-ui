import { clsx } from "clsx";
import { baseRing, invalidRingClasses } from "../assets/styles";
import type { ClassValue } from "clsx";

/**
 * Applies the package's invalid-field ring to any surface: the outline's shape,
 * and the danger colour it takes while the element carries `aria-invalid`.
 *
 * The ring vocabulary itself stays internal — a surface composes the treatment,
 * never the class strings behind it, so there is one error-outline technique.
 *
 * @param classes - the surface's own classes, where it has any.
 * @returns those classes carrying the invalid ring.
 */
export function useInvalidRing(...classes: ClassValue[]): string {
  // Concatenated rather than merged through `cn`: tailwind-merge reads `outline`
  // and `outline-2` as one width group and drops the ring's style half.
  return clsx(baseRing, invalidRingClasses, classes);
}
