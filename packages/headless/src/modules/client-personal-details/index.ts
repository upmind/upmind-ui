// -----------------------------------------------------------------------------
/**
 * @module client-personal-details
 * @description A client's own profile — one scoped, `dataManagerMachine`-backed
 * editor (`usePersonalDetails`).
 *
 * This barrel is the module's ONLY public surface —
 * `client-personal-details.services.ts`, `.mappers.ts`, `.schemas.ts` and
 * `usePersonalDetails.machine.ts` each carry a line-1 internal marker
 * and are never imported directly by another module. Curated named
 * re-exports only; no `export *`.
 */

// --- Composable (editor)
export {
  usePersonalDetails,
  type UsePersonalDetails
} from "./usePersonalDetails";

// --- Scope matrix — public
export {
  PERSONAL_DETAILS_SCOPE_MATRIX,
  ClientPersonalDetailsContextTypes
} from "./client-personal-details.types";
export type { PersonalDetailsScopeMatrix } from "./client-personal-details.types";

// --- Public model types
export type {
  ProfileContext,
  ProfileField,
  ProfileModel
} from "./client-personal-details.types";

// --- Sub-composable type exports for consumers
export type { UsePersonalDetailsActions } from "./usePersonalDetails.actions";
export type { UsePersonalDetailsContext } from "./usePersonalDetails.context";
export type { UsePersonalDetailsMeta } from "./usePersonalDetails.meta";
export type { UsePersonalDetailsInternals } from "./usePersonalDetails.internals";
