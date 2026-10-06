// -----------------------------------------------------------------------------
/**
 * @module portal/brands
 * @description The roster of app-defined brands, for `useTheme`'s injection
 * and picker. Each brand lives WHOLE in its own config file — theme beside
 * shape, one file per brand (operator ruling 2026-08-25) — built with
 * `@upmind/tokens`' public `defineTheme`, never added to the token package:
 * a product's brand is the product's, and nothing under `design-system/`
 * changes for one (X1).
 *
 * The roster is EMPTY today: an app brand's CSS is generated at runtime, so it
 * cannot paint on the first frame, and every shape this app ships wears a
 * theme the stylesheet already carries. The seam stands ready for the next one.
 */

import type { ResolvedTheme } from "@upmind/tokens";
// -----------------------------------------------------------------------------

/** Every brand this app defines for itself, in picker order. */
export const APP_BRANDS: readonly ResolvedTheme[] = [];
