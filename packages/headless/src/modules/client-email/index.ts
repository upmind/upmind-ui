// -----------------------------------------------------------------------------
/**
 * @module client-email
 * @description Client-email module — a client's email collection
 * (`useClientEmails`) and a per-email form editor (`useClientEmailManager`),
 * both scoped by actor/context (ADR 001).
 */

// --- Public types + scope matrices
export * from "./client-email.types";

// --- Composables
export { useClientEmails, type UseClientEmails } from "./useClientEmails";
export {
  useClientEmailManager,
  type UseClientEmail
} from "./useClientEmailManager";

// --- Sub-composable type exports for consumers
export type { UseClientEmailsContext } from "./useClientEmails.context";
export type { UseClientEmailsMeta } from "./useClientEmails.meta";
export type { UseClientEmailsActions } from "./useClientEmails.actions";
export type { UseClientEmailsInternals } from "./useClientEmails.internals";
export type { UseClientEmailManagerContext } from "./useClientEmailManager.context";
export type { UseClientEmailManagerMeta } from "./useClientEmailManager.meta";
export type { UseClientEmailManagerActions } from "./useClientEmailManager.actions";
export type { UseClientEmailManagerInternals } from "./useClientEmailManager.internals";
