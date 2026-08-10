// --- Active session composable (recommended public API)
export * from "./useActiveSession";

// --- Session store (internal, used by useActiveSession)
export * from "./useSessionStore";

// --- Sync (cross-tab, cookie, auth subscription)
export { authSubscription } from "./session-store.sync";

// --- Cookie token utilities (curated named re-exports for cross-module consumers)
export {
  getTokenFromStorage,
  dumpTokenFromStorage,
  persistTokenToStorage,
  resolveClientId
} from "./session-store.utils";

// --- Mappers (curated re-export for cross-module consumers)
export { mapSessionUser } from "./session-store.mappers";

export * from "./session-store.types";
