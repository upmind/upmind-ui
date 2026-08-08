// -----------------------------------------------------------------------------
/**
 * @module client-email
 * @description A client's own email addresses. This module ships TWO scoped
 * composables: the collection (`useClientEmails`) and the per-email form editor
 * (`useClientEmailManager`).
 *
 * This barrel is the module's ONLY public surface — `client-email.services.ts`,
 * `client-email.mappers.ts`, `client-email.schemas.ts` and
 * `useClientEmailManager.machine.ts` each carry a line-1 internal marker and
 * are never imported directly by another module. Curated named re-exports
 * only; no `export *`.
 *
 * NO SCHEMA EXPORTS HERE. `useSchema`/`useUischema` are adopted by the
 * manager's machine and reach consumers through
 * `useClientEmailManager().useContext().schema` / `.uischema`.
 */

// --- Composables (collection + manager)
export { useClientEmails, type UseClientEmails } from "./useClientEmails";
export {
  useClientEmailManager,
  type UseClientEmailManager
} from "./useClientEmailManager";

// NO SCENARIO KEYS HERE. The module declares its own in `client-email.types.ts`
// (F-1's self-registration), but they reach consumers only through
// `@upmind-automation/headless/scenarios` — the keys never touch this barrel.

// --- Scope matrices — one per composable, both public
export {
  CLIENT_EMAILS_SCOPE_MATRIX,
  ClientEmailsContextTypes,
  CLIENT_EMAIL_SCOPE_MATRIX,
  ClientEmailContextTypes,
  EmailTypes
} from "./client-email.types";
export type {
  ClientEmailsScopeMatrix,
  ClientEmailScopeMatrix
} from "./client-email.types";

// --- Public model types (shared by both composables)
export type { Email, EmailModel, EmailContext } from "./client-email.types";

// --- Sub-composable type exports for consumers (collection)
export type { UseClientEmailsActions } from "./useClientEmails.actions";
export type { UseClientEmailsContext } from "./useClientEmails.context";
export type { UseClientEmailsMeta } from "./useClientEmails.meta";
export type { UseClientEmailsInternals } from "./useClientEmails.internals";

// --- Sub-composable type exports for consumers (manager)
export type { UseClientEmailManagerActions } from "./useClientEmailManager.actions";
export type { UseClientEmailManagerContext } from "./useClientEmailManager.context";
export type { UseClientEmailManagerMeta } from "./useClientEmailManager.meta";
export type { UseClientEmailManagerInternals } from "./useClientEmailManager.internals";
