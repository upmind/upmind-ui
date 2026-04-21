// -----------------------------------------------------------------------------
/**
 * @module shell/useShell
 * @description Tracks shell component configuration state during navigation.
 */

import { type Shell } from "./types";

// -----------------------------------------------------------------------------

/** Components configured this navigation cycle. */
const configured = new Set<Shell>();

export const useShell = () => {
  /** Reset tracking for new navigation cycle. */
  function reset(): void {
    configured.clear();
  }

  /** Mark a component as configured. */
  function mark(component: Shell): void {
    configured.add(component);
  }

  /** Check if a component was configured. */
  function has(component: Shell): boolean {
    return configured.has(component);
  }

  return {
    has,
    mark,
    reset
  };
};
