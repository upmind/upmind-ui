/**
 * @module client-phone-dry
 * @description `client-phone-dry` — query-variant scoped module for client
 * phone numbers, side-by-side with `client-phone/` (`docs/sdd/client-phone-dry-smoke/design.md`).
 * This barrel is the module's ONLY public surface — every other file carries
 * its own `@internal` marker and is never imported directly by another
 * module.
 */

export {
  useClientPhonesDry,
  type UseClientPhonesDry
} from "./useClientPhonesDry";

// --- Scope matrix
export {
  CLIENT_PHONE_DRY_SCOPE_MATRIX,
  PhoneContextTypes
} from "./client-phone-dry.types";
export type { ClientPhoneDryScopeMatrix } from "./client-phone-dry.types";

// --- Sub-composable type exports for consumers
export type { UseClientPhonesDryActions } from "./useClientPhonesDry.actions";
export type { UseClientPhonesDryContext } from "./useClientPhonesDry.context";
export type { UseClientPhonesDryMeta } from "./useClientPhonesDry.meta";
export type { UseClientPhonesDryInternals } from "./useClientPhonesDry.internals";

// --- Public item/model types
export type { Phone, PhoneModel } from "./client-phone-dry.types";

// --- Form schema (mirrors `client-phone/index.ts:4-7`)
export {
  useSchema as usePhoneSchema,
  useUischema as usePhoneUischema
} from "./client-phone-dry.schemas";
