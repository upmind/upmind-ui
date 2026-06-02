// -----------------------------------------------------------------------------
/**
 * @module utils/useCalculate.types
 * @description Type definitions for the cart/calculate API composable.
 *
 * Re-exports `PriceEntry` from the product module — single source of truth.
 */

import type { PriceEntry } from "../modules/product/types";

// -----------------------------------------------------------------------------

export type { PriceEntry };

/**
 * Input dispatcher for `calculate()`:
 * - `number`                 → format one value, return `string`
 * - `Record<string, number>` → format each (deduped), return keyed strings
 * - `PriceEntry[]`           → sum and format, return `{ total, totalFormatted }`
 *
 * Note: `PriceEntry = number | { price, quantity }`, so a bare list of numbers
 * is a valid `PriceEntry[]` and routes to sum-mode. To get individual formatted
 * strings, use a `Record<string, number>`.
 */
export type CalculateInput = number | Record<string, number> | PriceEntry[];

/**
 * Conditional return type — picked from the input shape.
 */
export type CalculateResult<T extends CalculateInput> = T extends number
  ? string
  : T extends PriceEntry[]
    ? { total: number; totalFormatted: string }
    : T extends Record<string, number>
      ? Record<keyof T, string>
      : never;

/** Sum-mode result returned from a `PriceEntry[]` lookup. */
export type CalculateSumResult = { total: number; totalFormatted: string };

/** Shape of the CALCULATE event the static `calculateActor` expects. */
export type CalculateEvent<T extends CalculateInput = CalculateInput> = {
  type: "CALCULATE";
  data: { currencyId: string; input: T };
};
