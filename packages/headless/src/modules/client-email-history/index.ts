// -----------------------------------------------------------------------------
/**
 * @module client-email-history
 * @description Public exports for a client's own email history — the
 * COLLECTION (`useClientReceivedEmails`) and the SINGLE READ
 * (`useClientReceivedEmail`), each a separately exported, separately
 * consumed capability (Research R1). Curated named re-exports only — no
 * `export *` (Module Visibility Law).
 */

// --- Composables
export { useClientReceivedEmails } from "./useClientReceivedEmails";
export type { UseClientReceivedEmails } from "./useClientReceivedEmails";
export { useClientReceivedEmail } from "./useClientReceivedEmail";
export type { UseClientReceivedEmail } from "./useClientReceivedEmail";

// --- Scope matrix — the COLLECTION's only. The single read's matrix refuses
// every actor, so it names no context a consumer could spell and stays internal;
// it marks its record with the builder's `.withId(id)`, not with a context.
export {
  RECEIVED_EMAILS_SCOPE_MATRIX,
  ReceivedEmailsContextTypes,
  ReceivedEmailsSortableProperties
} from "./client-email-history.types";
export type { ReceivedEmailsScopeMatrix } from "./client-email-history.types";

// --- Public model types
export type { SentEmail, SentEmailModel } from "./client-email-history.types";
// Re-exported so a consumer can read `SentEmail.status` (a `SentEmailStatus`)
// without taking a direct dependency on `@upmind-automation/types`.
export { SentEmailStatus } from "@upmind-automation/types";

// --- Sub-composable type exports (collection)
export type { UseClientReceivedEmailsActions } from "./useClientReceivedEmails.actions";
export type { UseClientReceivedEmailsContext } from "./useClientReceivedEmails.context";
export type { UseClientReceivedEmailsMeta } from "./useClientReceivedEmails.meta";
export type { UseClientReceivedEmailsInternals } from "./useClientReceivedEmails.internals";

// --- Sub-composable type exports (single read)
export type { UseClientReceivedEmailActions } from "./useClientReceivedEmail.actions";
export type { UseClientReceivedEmailContext } from "./useClientReceivedEmail.context";
export type { UseClientReceivedEmailMeta } from "./useClientReceivedEmail.meta";
export type { UseClientReceivedEmailInternals } from "./useClientReceivedEmail.internals";
