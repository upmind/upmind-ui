/**
 * Plain, point-in-time snapshot of a booted composable cell (design §2).
 * Never cache across pulls — a fresh `snapshot()` is the reactivity contract.
 */
export interface ReflectedSnapshot {
  actions: readonly string[]; // live action names for the booted actor cell
  context: Record<string, unknown>; // plain values; may carry schema/uischema
  meta: Record<string, boolean>; // already-evaluated flags (design §3)
}
