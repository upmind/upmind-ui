/**
 * Plain, point-in-time snapshot of a booted composable cell. Never cache
 * across pulls — a fresh `snapshot()` is the reactivity contract.
 * `reflect()` omits undefined-valued entries from `context`/`meta` at every
 * depth before this shape is emitted; other non-JSON values are the
 * adapter's responsibility.
 */
export interface ReflectedSnapshot {
  actions: readonly string[]; // live action names for the booted actor cell
  context: Record<string, unknown>; // plain values; may carry schema/uischema
  meta: Record<string, boolean>; // already-evaluated flags
}
