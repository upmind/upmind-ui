// -----------------------------------------------------------------------------
/**
 * @module session-store/useSession.internals
 * @description Session internals sub-composable.
 * Exposes raw session store sub-composables for advanced use cases.
 */

/**
 * Factory for session internals.
 * Provides access to the underlying session store sub-composables.
 *
 * @returns Raw session store access
 */
export function createSessionInternals() {}

// Type export for consumers
export type UseActiveSessionInternals = ReturnType<
  typeof createSessionInternals
>;
