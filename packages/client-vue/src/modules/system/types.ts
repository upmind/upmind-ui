// -----------------------------------------------------------------------------
/**
 * @module system/types
 * @description Type definitions for system view components.
 */

import type { InterstitialProps } from "@upmind/ui";

// -----------------------------------------------------------------------------

/** Loading defaults closeLabel, so callers override any subset of the interstitial. */
export type LoadingProps = Partial<InterstitialProps>;

export interface RouteViewProps {
  loadingProps?: LoadingProps;
}
