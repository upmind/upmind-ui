// -----------------------------------------------------------------------------
/**
 * @module portal/brands
 * @description The roster of app-defined brands, for `useTheme`'s injection
 * and picker. Each brand lives WHOLE in its own config file — theme beside
 * shape, one file per brand (operator ruling 2026-08-25) — built with
 * `@upmind/tokens`' public `defineTheme`, never added to the token package:
 * a product's brand is the product's, and nothing under `design-system/`
 * changes for one (X1).
 */

import { hostgridTheme } from "./config/hostgrid";
import type { ResolvedTheme } from "@upmind/tokens";

/** Every brand this app defines for itself, in picker order. */
export const APP_BRANDS: readonly ResolvedTheme[] = [hostgridTheme];
