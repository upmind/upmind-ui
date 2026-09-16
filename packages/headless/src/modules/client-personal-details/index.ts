// -----------------------------------------------------------------------------
/**
 * @module client-personal-details
 * @description A client's own profile. This module ships TWO scoped
 * composables: the query-backed read half (`usePersonalDetails`) and the
 * `dataManagerMachine`-backed editor half (`usePersonalDetailsManager`).
 *
 * This barrel is the module's ONLY public surface —
 * `client-personal-details.services.ts`, `.mappers.ts`, `.schemas.ts` and
 * `usePersonalDetailsManager.machine.ts` each carry a line-1 internal marker
 * and are never imported directly by another module. Curated named
 * re-exports only; no `export *`.
 */

// --- Composables (read + editor)
export {
  usePersonalDetails,
  type UsePersonalDetails
} from "./usePersonalDetails";
export {
  usePersonalDetailsManager,
  type UsePersonalDetailsManager
} from "./usePersonalDetailsManager";

// --- Scope matrix — shared by both composables, public
export {
  PERSONAL_DETAILS_SCOPE_MATRIX,
  ClientPersonalDetailsContextTypes
} from "./client-personal-details.types";
export type { PersonalDetailsScopeMatrix } from "./client-personal-details.types";

// --- Public model types
export type {
  ProfileContext,
  ProfileField,
  ProfileModel,
  ProfileRecord
} from "./client-personal-details.types";

// --- Sub-composable type exports for consumers (read half)
export type { UsePersonalDetailsActions } from "./usePersonalDetails.actions";
export type { UsePersonalDetailsContext } from "./usePersonalDetails.context";
export type { UsePersonalDetailsMeta } from "./usePersonalDetails.meta";
export type { UsePersonalDetailsInternals } from "./usePersonalDetails.internals";

// --- Sub-composable type exports for consumers (editor half)
export type { UsePersonalDetailsManagerActions } from "./usePersonalDetailsManager.actions";
export type { UsePersonalDetailsManagerContext } from "./usePersonalDetailsManager.context";
export type { UsePersonalDetailsManagerMeta } from "./usePersonalDetailsManager.meta";
export type { UsePersonalDetailsManagerInternals } from "./usePersonalDetailsManager.internals";
