// -----------------------------------------------------------------------------
/**
 * @module client-phone
 * @description A client's own phone numbers. This module ships TWO scoped
 * composables: the collection (`useClientPhones`) and the per-phone form
 * editor (`useClientPhoneManager`).
 *
 * This barrel is the module's ONLY public surface — `client-phone.services.ts`,
 * `client-phone.mappers.ts`, `client-phone.schemas.ts` and
 * `useClientPhoneManager.machine.ts` each carry a line-1 internal marker and
 * are never imported directly by another module. Curated named re-exports
 * only; no `export *`.
 *
 * NO SCHEMA EXPORTS HERE (decision D-4). `useSchema`/`useUischema` are
 * adopted by the manager's machine and reach consumers through
 * `useClientPhoneManager().useContext().schema` / `.uischema`.
 *
 * Both composables support the CLIENT'S OWN scope only — `staff` and `guest`
 * are compile-time errors (`.as('staff')` fails to build), per operator
 * ruling 1 (2026-08-08). Every staff capability the legacy oracle exposes is
 * recorded as a signed drop in `docs/story-bundles/client-phone/parity.yaml`
 * rows S1-S7.
 */

// --- Composables (collection + manager)
export { useClientPhones, type UseClientPhones } from "./useClientPhones";
export {
  useClientPhoneManager,
  type UseClientPhoneManager
} from "./useClientPhoneManager";

// --- Scope matrices — one per composable, both public
export {
  CLIENT_PHONES_SCOPE_MATRIX,
  ClientPhonesContextTypes,
  CLIENT_PHONE_SCOPE_MATRIX,
  ClientPhoneContextTypes
} from "./client-phone.types";
export type {
  ClientPhonesScopeMatrix,
  ClientPhoneScopeMatrix
} from "./client-phone.types";

// --- Public model types (shared by both composables)
export type {
  Phone,
  PhoneModel,
  PhoneContext,
  IPhoneData
} from "./client-phone.types";

// --- Sub-composable type exports for consumers (collection)
export type { UseClientPhonesActions } from "./useClientPhones.actions";
export type { UseClientPhonesContext } from "./useClientPhones.context";
export type { UseClientPhonesMeta } from "./useClientPhones.meta";
export type { UseClientPhonesInternals } from "./useClientPhones.internals";

// --- Sub-composable type exports for consumers (manager)
export type { UseClientPhoneManagerActions } from "./useClientPhoneManager.actions";
export type { UseClientPhoneManagerContext } from "./useClientPhoneManager.context";
export type { UseClientPhoneManagerMeta } from "./useClientPhoneManager.meta";
export type { UseClientPhoneManagerInternals } from "./useClientPhoneManager.internals";
