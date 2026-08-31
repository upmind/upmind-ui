import { ref } from "vue";
// Deep path, never the `../scope` barrel — see the aggregator-barrel
// `export *` hazard note in `client-phone/useClientPhones.ts`.
import { createScopedComposable } from "../scope/scope.builder";
import createClientNoteServices from "./client-notes.services";
import { CLIENT_NOTES_SCOPE_MATRIX } from "./client-notes.types";
import { createClientNotesActions } from "./useClientNotes.actions";
import { createClientNotesContext } from "./useClientNotes.context";
import { createClientNotesInternals } from "./useClientNotes.internals";
import { createClientNotesMeta } from "./useClientNotes.meta";
import type { ClientNotesScopeMatrix } from "./client-notes.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-notes/useClientNotes
 * @description Scoped, query-backed collection of a client's own vault: one
 * TanStack list query per concrete `(actor, context)` scope, minted once at
 * construction so it survives component lifecycles. Its sibling is
 * `useClientNoteManager` — a second scoped composable in the same module,
 * registered under the SAME module name; the composable name and the scope
 * key carry the differentiation.
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createClientNotesForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope. `config.context` goes in here and
   * nowhere else, so every request the collection issues resolves the same
   * target client.
   */
  const service = createClientNoteServices(actorScope, config.context);

  // Mint the list query ONCE per scope — a `service.loadList()` inside a layer
  // factory mints a second query, with its own refs, key and effect scope.
  const query = service.loadList();

  /**
   * The revealed-secret map — `{ assetId: plaintext }`. Minted ONCE per
   * scope, here, and threaded into BOTH `useActions()` (which writes it via
   * `reveal`/`hide`) and `useContext()` (which reads it) — so it survives
   * every `useActions()`/`useContext()` call across every consuming
   * component, and both sub-composables observe the same instance rather
   * than a copy. Deliberately NOT TanStack, not the machine: it must never
   * be cached or persisted (row C11).
   */
  const revealed = ref<Record<string, string>>({});

  /**
   * ONE actions instance per scope, not one per `useActions()` call — the
   * revealed map above must survive across every `useActions()` call.
   * Mirrors the manager half.
   */
  const actions = createClientNotesActions(
    actorScope,
    service,
    query,
    scopeKey,
    revealed
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for collection actions (row mutations, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for collection context (reactive list + lookups). */
    useContext: () =>
      createClientNotesContext(actorScope, service, query, revealed),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createClientNotesInternals(actorScope, query),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () => createClientNotesMeta(actorScope, service, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for a client's own vault collection.
 *
 * @example
 * ```ts
 * const notes = useClientNotes().as('self')
 * const { data, revealed } = notes.useContext()
 * await notes.useActions().isReady()
 * await notes.useActions().reveal(id)
 * ```
 */
export const useClientNotes = createScopedComposable<
  ReturnType<typeof createClientNotesForScope>,
  ClientNotesScopeMatrix
>("client-notes", createClientNotesForScope, CLIENT_NOTES_SCOPE_MATRIX);

// Type export for consumers
export type UseClientNotes = ReturnType<typeof useClientNotes>;
