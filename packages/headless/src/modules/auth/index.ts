// -----------------------------------------------------------------------------
/**
 * @module auth
 * @description Auth module.
 * Unified authentication for guest, client, and staff actors.
 */

export * from "./useAuth";
export * from "./auth.types";

// --- Sub-composable type exports for consumers
export type { UseAuthActions } from "./useAuth.actions";
export type { UseAuthContext } from "./useAuth.context";
export type { UseAuthMeta } from "./useAuth.meta";
export type { UseAuthInternals } from "./useAuth.internals";

// --- Email-verification link flow (M2)
export { useVerifyEmail, type UseVerifyEmail } from "./useVerifyEmail";

// --- Register form schema (reused by the client-lifecycle guest-upgrade form).
export {
  useRegisterSchema,
  useRegisterUischema
} from "./auth.schemas.register";
