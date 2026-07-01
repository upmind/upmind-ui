/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module auth/schemas
 * @description Auth form schemas.
 * Exports JSON Schema and UI Schema generators for all auth forms.
 * Verbatim from @next-legacy auth/auth.schemas.ts.
 *
 * WARNING: Do not import directly. Use via auth machine/composable only.
 */

// --- login (same for all actors)
export { useLoginSchema, useLoginUischema } from "./auth.schemas.login";
// --- register
export {
  useRegisterSchema,
  useRegisterUischema
} from "./auth.schemas.register";
// --- recover
export { useRecoverSchema, useRecoverUischema } from "./auth.schemas.recover";
// --- 2fa
export { useTwoFASchema, useTwoFAUischema } from "./auth.schemas.twofa";
