/**
 * The one shared composable-key manifest (design §5). Executors declare their
 * own live-factory maps `satisfies ComposableRegistry<…>` against this union —
 * renaming or removing a key fails compilation in every executor and fixture
 * typed against {@link ComposableKey}. There is no second key source.
 */
export const COMPOSABLE_KEY = {
  AUTH: "auth"
} as const;

export type ComposableKey =
  (typeof COMPOSABLE_KEY)[keyof typeof COMPOSABLE_KEY];
