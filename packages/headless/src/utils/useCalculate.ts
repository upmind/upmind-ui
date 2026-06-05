// -----------------------------------------------------------------------------
/**
 * @module utils/useCalculate
 * @description Memoised wrapper around `POST /cart/calculate`.
 *
 * Two modes, picked from input shape (DD-4):
 * - Format: `number` | `Record<string, number>` → individual strings
 * - Sum:    `PriceEntry[]`                       → `{ total, totalFormatted }`
 *
 * Arrays are ALWAYS sum-mode — a bare list of numbers reads as "add these up",
 * like a receipt. To format each value individually, use a labelled object.
 *
 * One unified cache (DD-1). Every successful API response writes BOTH
 * the request key AND `${currencyId}:${result.total}` so future single-value
 * lookups for the resolved total are also cache hits.
 *
 * Defensive hygiene (DD-5) — nil filtering, empty short-circuit, nil whole-input
 * — lives INSIDE the composable. Callers never need `compact()` or
 * `if (length)` boilerplate.
 *
 * Concurrency (DD-7):
 * - `AsyncDebouncer({ wait: useTime().INTERACTIVE, trailing })` wraps the
 *   actor's `calculate` call
 * - Module-level `inFlight: Map<string, Promise<...>>` provides per-key dedup
 *   for concurrent callers in the same JS frame.
 */

import { AsyncDebouncer } from "@tanstack/pacer";
import {
  filter,
  forEach,
  get,
  isArray,
  isEmpty,
  isNil,
  isNumber,
  isPlainObject,
  map,
  mapValues,
  uniq,
  values as objValues
} from "lodash-es";

import { useQuery } from "../modules/query";
import { useTime } from "./useTime";

import type {
  CalculateEvent,
  CalculateInput,
  CalculateResult,
  CalculateSumResult,
  PriceEntry
} from "./useCalculate.types";

// -----------------------------------------------------------------------------

/**
 * One unified cache (DD-1). Keys come in two shapes, both per-currency:
 * - Value key: `${currencyId}:${value}`
 * - Expression key: `${currencyId}:${signature}`
 *
 * Every successful API response writes BOTH:
 *   1. The key for whatever the caller asked about
 *   2. The key for the resolved `total` returned by the API
 */
const cache = new Map<string, CalculateSumResult>();

/**
 * In-flight dedup (DD-7). Concurrent callers for the same key share the same
 * Promise. Pacer's `asyncQueuer` is FIFO and doesn't natively dedup by key, so
 * we use a Map keyed by the same cache key.
 */
const inFlight = new Map<string, Promise<CalculateSumResult>>();

/** Test helper — clears both maps. NOT exposed via `useCalculate()`. */
export function clearCalculateCache(): void {
  cache.clear();
  inFlight.clear();
}

/**
 * Stable, order-insensitive key for an array of `PriceEntry`.
 * Pure-number arrays naturally produce stable keys for the same array twice.
 */
function keyFor(currencyId: string, input: number | PriceEntry[]): string {
  if (isNumber(input)) return `${currencyId}:${input}`;
  const normalised = map(input, p =>
    isNumber(p) ? p : [p.price, p.quantity]
  ).sort();
  return `${currencyId}:${JSON.stringify(normalised)}`;
}

// -----------------------------------------------------------------------------

export function useCalculate() {
  const { post, useUrl } = useQuery();

  /**
   * Single API call. Always writes two cache entries on success (DD-1):
   *  - the key for what the caller asked about
   *  - the key for the resolved total
   */
  async function callApi(
    currencyId: string,
    prices: PriceEntry[],
    requestKey: string
  ): Promise<CalculateSumResult> {
    return post({
      mutationKey: ["cart", "calculate"],
      url: useUrl("cart/calculate", {}),
      withAccessToken: true,
      data: { currency_id: currencyId, prices }
    }).then((data: unknown) => {
      const result: CalculateSumResult = {
        total: get(data, "total", 0) as number,
        totalFormatted: get(data, "total_formatted", "") as string
      };
      cache.set(requestKey, result);
      cache.set(`${currencyId}:${result.total}`, result);
      return result;
    });
  }

  /**
   * Lookup-or-fetch helper. Used by both single-value and array paths.
   * - Filters nil entries (DD-5)
   * - Empty short-circuit returns `{ total: 0, totalFormatted: "" }` (DD-5)
   * - Cache hit → cached result
   * - In-flight hit → shared promise (DD-7)
   * - Miss → fire API, register in-flight, on settle remove from inFlight
   */
  async function lookup(
    currencyId: string,
    prices: PriceEntry[]
  ): Promise<CalculateSumResult> {
    const cleaned = filter(prices, p => !isNil(p)) as PriceEntry[];
    if (!cleaned.length) return { total: 0, totalFormatted: "" };

    const key =
      cleaned.length === 1 && isNumber(cleaned[0])
        ? `${currencyId}:${cleaned[0]}`
        : keyFor(currencyId, cleaned);

    const cached = cache.get(key);
    if (cached) return cached;

    const pending = inFlight.get(key);
    if (pending) return pending;

    const promise = callApi(currencyId, cleaned, key).finally(() => {
      inFlight.delete(key);
    });
    inFlight.set(key, promise);
    return promise;
  }

  /** Format a single number → its formatted string. */
  async function formatValue(
    currencyId: string,
    value: number
  ): Promise<string> {
    const { totalFormatted } = await lookup(currencyId, [value]);
    return totalFormatted;
  }

  // --- Public API: dispatcher ------------------------------------------------
  /**
   * Format/sum prices via the cart/calculate endpoint.
   *
   * Discriminator (DD-4):
   * - `number`                  → `string`
   * - `Record<string, number>`  → keyed strings (format-mode)
   * - `PriceEntry[]`            → `{ total, totalFormatted }` (sum-mode, ALWAYS)
   */
  async function calculate<T extends CalculateInput>(
    currencyId: string,
    input: T
  ): Promise<CalculateResult<T>> {
    // DD-5: nil whole-input → empty result
    if (isNil(input)) return "" as CalculateResult<T>;

    // single number → formatted string
    if (isNumber(input)) {
      return formatValue(currencyId, input) as Promise<CalculateResult<T>>;
    }

    // keyed object → keyed strings (deduped, nil values → "")
    if (isPlainObject(input)) {
      const entries = input as Record<string, number | null | undefined>;
      const cleanValues = filter(
        objValues(entries),
        v => !isNil(v)
      ) as number[];
      const unique = uniq(cleanValues);
      const formatted = await Promise.all(
        map(unique, v => formatValue(currencyId, v))
      );
      const byValue = new Map<number, string>();
      forEach(unique, (v, i) => byValue.set(v, formatted[i]));
      return mapValues(entries, v =>
        isNil(v) ? "" : (byValue.get(v as number) ?? "")
      ) as CalculateResult<T>;
    }

    // any array → sum-mode (single result). DD-5 nil filtering happens in lookup().
    if (isArray(input)) {
      return lookup(currencyId, input as PriceEntry[]) as Promise<
        CalculateResult<T>
      >;
    }

    throw new Error("calculate: invalid input shape");
  }

  // --- Public API: pushPrice helper ------------------------------------------
  /**
   * Push an entry into a `PriceEntry[]`. Shape is deterministic from inputs (DD-2):
   * - `quantity` <= 0 (or nil) → no-op
   * - `quantity === 1`         → push the bare number
   * - `quantity > 1`           → push `{ price: amount, quantity }`
   */
  function pushPrice(
    prices: PriceEntry[],
    amount: number,
    quantity: number
  ): void {
    if (!quantity || quantity < 0) return;
    if (quantity === 1) prices.push(amount);
    else prices.push({ price: amount, quantity });
  }

  return { calculate, pushPrice };
}

export type UseCalculate = ReturnType<typeof useCalculate>;

// -----------------------------------------------------------------------------
// XState 4 callback actor — single static export (DD-3). Machines spawn it as-is
// and send `CALCULATE` events in `calculate`'s native shape.
//
// Behavioural contract (DD-6):
//  - Emits CALCULATING immediately on each CALCULATE (before debounce)
//  - Emits CALCULATED on success
//  - Emits CALCULATE_CANCELLED on real errors / invalid input
//  - Stays silent on aborted requests (empty error)
//  - Returns a cleanup function that cancels in-flight requests on unspawn
//
// Concurrency (DD-7):
//  - Wraps `calculate` in `asyncDebounce({ wait: 80, trailing })` per-spawn so
//    rapid CALCULATE events with different inputs coalesce to one API call.
//  - In-flight dedup is handled inside `lookup` via the module-level inFlight Map.
// -----------------------------------------------------------------------------

/**
 * Stable signature for any `CalculateInput`. Used to skip duplicate CALCULATE
 * events that would resolve to the same result — saves a CALCULATING/CALCULATED
 * round-trip (and the spinner flicker that goes with it) when the inputs
 * haven't actually changed.
 */
function inputSignature(currencyId: string, input: CalculateInput): string {
  if (isNumber(input)) return `${currencyId}:n:${input}`;
  if (isArray(input)) {
    const normalised = map(input, p =>
      isNumber(p) ? p : [p?.price, p?.quantity]
    ).sort();
    return `${currencyId}:a:${JSON.stringify(normalised)}`;
  }
  // plain object — sort keys for determinism
  const sorted = map(
    Object.keys(input as Record<string, unknown>).sort(),
    k => [k, (input as Record<string, unknown>)[k]]
  );
  return `${currencyId}:o:${JSON.stringify(sorted)}`;
}

export function calculateActor() {
  const { calculate } = useCalculate();
  const { cancel } = useQuery();
  const wait = useTime().INTERACTIVE;

  // per-spawn debouncer — separate spawns don't share debounce state.
  // Using the class directly (not `asyncDebounce`) so cleanup can call
  // `cancel()` to drop the pending trailing call on unspawn.
  const debouncer = new AsyncDebouncer(
    (currencyId: string, input: CalculateInput) => calculate(currencyId, input),
    { wait, leading: false, trailing: true }
  );

  // per-spawn dedup: track the last requested signature so identical follow-up
  // CALCULATE events are skipped entirely (no CALCULATING flicker, no debounce
  // wait, no work). Reset on CANCEL/cleanup so a fresh start replays cleanly.
  let lastSignature: string | null = null;

  return (
    callback: (event: { type: string; data?: unknown }) => void,
    onReceive: (
      handler: (event: { type: string; data?: unknown }) => void
    ) => void
  ): (() => void) => {
    onReceive(event => {
      if (event.type === "CALCULATE") {
        const { currencyId, input } = ((event as CalculateEvent).data ??
          {}) as Partial<CalculateEvent["data"]>;
        if (!currencyId || isNil(input)) {
          lastSignature = null;
          callback({ type: "CALCULATE_CANCELLED" });
          return;
        }

        // Skip if input is identical to the last request — output would be
        // the same and the consumer is already in the correct state.
        const signature = inputSignature(currencyId, input as CalculateInput);
        if (signature === lastSignature) return;
        lastSignature = signature;

        // DD-6: CALCULATING fires IMMEDIATELY, before debounce
        callback({ type: "CALCULATING" });

        debouncer
          .maybeExecute(currencyId, input as CalculateInput)
          .then(result => {
            // dropped (intermediate) calls resolve to `undefined` — don't emit
            // CALCULATED for those, only the trailing one.
            if (isNil(result)) return;
            callback({ type: "CALCULATED", data: result });
          })
          .catch(error => {
            // aborted requests have empty error payload → stay silent
            if (!isEmpty(error)) callback({ type: "CALCULATE_CANCELLED" });
          });
        return;
      }

      if (event.type === "CANCEL") {
        lastSignature = null;
        debouncer.cancel();
        cancel(["cart", "calculate"]);
      }
    });

    // XState 4: returned function is the cleanup that runs on unspawn (DD-6)
    return () => {
      lastSignature = null;
      debouncer.cancel();
      cancel(["cart", "calculate"]);
    };
  };
}
