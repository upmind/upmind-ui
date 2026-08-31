// -----------------------------------------------------------------------------
/**
 * @module client-notes
 * @description A client's own vault — notes and secrets are ONE entity;
 * `IVaultAsset.encrypted` is the flag that decides which. This module ships
 * TWO scoped composables: the collection (`useClientNotes`) and the per-asset
 * form editor (`useClientNoteManager`).
 *
 * This barrel is the module's ONLY public surface — `client-notes.services.ts`,
 * `client-notes.mappers.ts`, `client-notes.schemas.ts` and
 * `useClientNoteManager.machine.ts` each carry a line-1 internal marker and
 * are never imported directly by another module. Curated named re-exports
 * only; no `export *`.
 *
 * NO SCHEMA EXPORTS HERE (`@decision` D7). `useSchema`/`useUischema` are
 * adopted by the manager's machine and reach consumers through
 * `useClientNoteManager().useContext().schema` / `.uischema`.
 *
 * Both composables support the CLIENT'S OWN scope only — `staff` and `guest`
 * are compile-time errors (`.as('staff')` fails to build), per the operator
 * cell ruling (2026-08-27). Every staff capability the legacy oracle exposes
 * is recorded as a signed drop in `docs/sdd/client-notes-vault/parity.yaml`
 * rows S1-S6.
 */

// --- Composables (collection + manager)
export { useClientNotes, type UseClientNotes } from "./useClientNotes";
export {
  useClientNoteManager,
  type UseClientNoteManager
} from "./useClientNoteManager";

// --- Scope matrices — one per composable, both public
export {
  CLIENT_NOTES_SCOPE_MATRIX,
  ClientNotesContextTypes,
  CLIENT_NOTE_SCOPE_MATRIX,
  ClientNoteContextTypes
} from "./client-notes.types";
export type {
  ClientNotesScopeMatrix,
  ClientNoteScopeMatrix
} from "./client-notes.types";

// --- Public model types (shared by both composables)
export type {
  VaultAsset,
  VaultAssetModel,
  VaultAssetActor,
  VaultAssetContext
} from "./client-notes.types";

// --- Sub-composable type exports for consumers (collection)
export type { UseClientNotesActions } from "./useClientNotes.actions";
export type { UseClientNotesContext } from "./useClientNotes.context";
export type { UseClientNotesMeta } from "./useClientNotes.meta";
export type { UseClientNotesInternals } from "./useClientNotes.internals";

// --- Sub-composable type exports for consumers (manager)
export type { UseClientNoteManagerActions } from "./useClientNoteManager.actions";
export type { UseClientNoteManagerContext } from "./useClientNoteManager.context";
export type { UseClientNoteManagerMeta } from "./useClientNoteManager.meta";
export type { UseClientNoteManagerInternals } from "./useClientNoteManager.internals";
