import { isArray, isPlainObject, keys } from "lodash-es";
// -----------------------------------------------------------------------------
/**
 * @module world/args
 * @description The ONE explicit way a `World.fire` step passes POSITIONAL
 * arguments to a multi-argument action. A bare array is never spread — an
 * action may legitimately take a single array argument, so the intent to spread
 * is MARKED, never guessed from the shape of the input.
 */

/**
 * The reserved key that brands a {@link PositionalArgs} envelope. A plain string
 * key (never a Symbol) so the marker survives JSON serialisation across the
 * Playwright bridge, exactly as every other `World` payload must.
 */
export const WORLD_ARGS_KEY = "__worldArgs" as const;

/** An envelope naming the exact, ordered argv an action is invoked with. */
export type PositionalArgs = { [WORLD_ARGS_KEY]: unknown[] };

/**
 * Wraps positional arguments for a multi-argument action so `World.fire` spreads
 * them explicitly: `fire("assignPaymentMethod", args(invoiceId, null))` calls
 * `action(invoiceId, null)`.
 */
export function args(...values: unknown[]): PositionalArgs {
  return { [WORLD_ARGS_KEY]: values };
}

/** Whether `input` is a {@link PositionalArgs} envelope and nothing else. */
export function isPositionalArgs(input: unknown): input is PositionalArgs {
  return (
    isPlainObject(input) &&
    isArray((input as Record<string, unknown>)[WORLD_ARGS_KEY]) &&
    keys(input).length === 1
  );
}

/**
 * The argv a `World.fire` invokes an action with: the spread tuple of a
 * {@link PositionalArgs} envelope; an empty argv for a bare `undefined` (so an
 * optional-parameter action is called bare, reading no supplied value); or the
 * lone value otherwise.
 */
export function fireArgv(input?: unknown): unknown[] {
  if (isPositionalArgs(input)) return input[WORLD_ARGS_KEY];
  return input === undefined ? [] : [input];
}
