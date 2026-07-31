import type { ComposableKey } from "./registry";

/** An executor's live-factory map, one entry per manifest key (design §5). */
export type ComposableRegistry<T = unknown> = Record<ComposableKey, () => T>;
