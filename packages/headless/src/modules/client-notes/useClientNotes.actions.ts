import { watch, type Ref } from "vue";
import { BrandConfigKeys } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { invalidateQueryByKey } from "../query";
// Deep path, never the `../scope` barrel — see useClientNotes.ts for the
// aggregator-barrel `export *` hazard this sidesteps.
import { remove as removeFromRegistry } from "../scope/scope.registry";
import { useActiveSession, useSessionStore } from "../session-store";
import { useI18n } from "../system-localisation";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  NotAuthenticatedError
} from "../../utils";
import { omit } from "lodash-es";
import type {
  ClientNoteListQuery,
  ClientNoteServices,
  FilterModel,
  SortModel,
  VaultAsset
} from "./client-notes.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { IVaultAsset } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-notes/useClientNotes.actions
 * @description Collection actions — row mutations, list controls, the three
 * no-template-slot capabilities (`convert` / `reveal` / `hide`) and
 * lifecycle. Query-backed: `destroy()` removes the registry entry, because
 * there is no service to stop.
 *
 * Per-asset FORM mutations are not here — `add` / `update` / `validate`
 * belong to `useClientNoteManager`, which owns the dirty/valid state they
 * need.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns ONLY
 * shared members; no `useClientNotes.actions.{actor}.ts` file exists.
 */
export function createClientNotesActions(
  _actorScope: ScopeActorTypes,
  service: ClientNoteServices,
  query: ClientNoteListQuery,
  scopeKey: string,
  revealed: Ref<Record<string, string>>
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /**
   * @decision B6
   * what: subscribes to `useSessionStore().useActions().onLogout(...)` for
   *   the lifetime of this scope and clears `revealed` WHOLESALE on every
   *   firing; the unsubscribe returned by `onLogout` is called from
   *   `destroy()` below, alongside the registry removal, so a torn-down
   *   scope leaves no dangling subscriber on the module-global logout set.
   * why: `generateScopeKey` only appends the context segment when
   *   `config.context` is set (`scope.utils.ts`), so `.as('self')` keys to
   *   `client-notes:client` with no client id. The scope registry is a
   *   module-global map, and `revealed` — decrypted secret plaintext — lives
   *   in this closure. Nothing purged the registry on logout
   *   (`clearAll()` is test-only), so a second client logging into the same
   *   tab inherited the first client's still-registered instance and its
   *   still-populated `revealed` map. Subscribing to the existing
   *   production `onLogout` signal (already used the same way in
   *   `auth/useAuth.ts`) closes the plaintext leak without touching scope
   *   resolution.
   * rejected: widening `generateScopeKey` so `.as('self')` keys include the
   *   resolved client id — correct at root, but it reshapes the scope key
   *   for every landed composable keyed the same way (client-phone,
   *   client-address, client-email, basket), none of which this fix's gates
   *   cover; filed as a platform issue against `modules/scope` instead of
   *   folded into this fix. Recording the exposure as a signed deferral —
   *   rejected because a fix exists and is narrow; shipping the exposure
   *   when it is closable is not an acceptable trade.
   *
   * NOT FIXED by this decision: the scope-key shape itself. `client-notes:
   *   client` still carries no client id — this closes the PLAINTEXT
   *   exposure specifically (clearing `revealed` on logout), not the
   *   underlying key collision.
   */
  const { onLogout } = useSessionStore().useActions();
  const unsubscribeLogout = onLogout(() => {
    revealed.value = {};
  });

  /**
   * This scope's settled ADDRESSABILITY outcome, or `undefined` while the
   * session is still settling.
   */
  function addressableOutcome(): boolean | undefined {
    if (service.isAvailable.value) return true;
    if (isSessionInitialised.value || !isSessionSettling.value) return false;
    return undefined;
  }

  /**
   * Resolves the addressability outcome, waiting only while the session is
   * still settling.
   *
   * @decision B5
   * what: awaits `useBrand().ensureConfig(...)` — the same lever
   *   `ensureAddressable` applies in `client-notes.services.ts` — BEFORE the
   *   first `addressableOutcome()` read.
   * why: `service.isAvailable` reads `isVaultEnabled()` SYNCHRONOUSLY off
   *   whatever brand config is already cached. A session that has already
   *   settled (`isSessionInitialised` true) with the brand config still in
   *   flight made `addressableOutcome()` return a SETTLED `false` on its
   *   first call, so the `watch()` below was never entered and `isReady()`
   *   resolved "no vault" even though the vault would enable itself a tick
   *   later once the config landed. `enabled`/`guard` on the collection's
   *   query don't have this failure mode because TanStack re-evaluates them
   *   reactively once the config resolves; `isReady()` is a one-shot promise
   *   and is not.
   * rejected: widening `addressableOutcome()`'s guard to also wait on a
   *   brand-loading flag — this module has no such flag exposed on
   *   `service`, and awaiting `ensureConfig` directly reuses the existing
   *   lever rather than adding a new one.
   */
  async function whenSessionSettles(): Promise<boolean> {
    await useBrand().ensureConfig(
      BrandConfigKeys.CLIENT_NOTES_AND_SECRETS_ENABLED
    );

    const settled = addressableOutcome();
    if (settled !== undefined) return settled;

    return new Promise<boolean>(resolve => {
      const stop = watch(
        [service.isAvailable, isSessionInitialised, isSessionSettling],
        () => {
          const outcome = addressableOutcome();
          if (outcome === undefined) return;
          stop();
          resolve(outcome);
        }
      );
    });
  }

  /** Resolves once the list query has completed its first fetch. */
  function whenListFetched(): Promise<boolean> {
    if (query.isFetched.value) return Promise.resolve(true);

    return new Promise<boolean>(resolve => {
      const stop = watch(query.isFetched, fetched => {
        if (!fetched) return;
        stop();
        resolve(true);
      });
    });
  }

  /**
   * Resolves once the collection is ready to read.
   * @returns true once the first fetch has settled, false if the session
   * settles without an addressable client.
   */
  async function isReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;

    return whenListFetched();
  }

  /**
   * Forces a re-read of the list from the server. Clears the revealed-secret
   * map WHOLESALE (row C11/B4) — a re-read may have changed the ciphertext,
   * so a plaintext revealed against the PRE-refresh row must not keep
   * answering for the post-refresh one. `revealed` is also cleared wholesale
   * by `destroy()` and by the `onLogout` subscription (`@decision` B6,
   * above) — three triggers, one map.
   * @throws {NotAuthenticatedError} when the session cannot address a client.
   */
  async function refresh(): Promise<void> {
    if (!service.isAvailable.value) throw new NotAuthenticatedError();

    const { error } = await query.refetch();
    revealed.value = {};
    if (error instanceof NotAuthenticatedError) throw error;
  }

  /**
   * Applies a filter INTENT — the `filters` branch of the one query model, so
   * `sort` and `pagination` are untouched by construction.
   */
  function filterBy(intent: FilterModel): void {
    query.setCriteria({ filters: intent });
  }

  /**
   * Applies a sort INTENT — the `sort` branch of the one query model, so
   * `filters` and `pagination` are untouched.
   */
  function sortBy(intent: SortModel): void {
    query.setCriteria({ sort: intent });
  }

  /**
   * Flips an asset between note and secret — the second no-template-slot
   * capability, and the sharpest expression of "one entity, a flag decides
   * which".
   *
   * @decision D4
   * what: a note with no label rejects with a typed error naming the missing
   *   field and fires NO request; the consumer opens the editor in response.
   * why: headless owns capability, not presentation. The oracle's
   *   `openUpdateAssetModal({ isConvertingToSecret: true })` is a UI response
   *   to a data precondition; the precondition IS the headless capability,
   *   preserved exactly, with the missing field named in the error's `data`.
   * rejected: silently sending `{ encrypted: true }` without a label — the
   *   API would create a label-less secret the oracle never permits; firing a
   *   UI event from headless — a layering violation.
   */
  async function convert(asset: VaultAsset): Promise<IVaultAsset | undefined> {
    if (asset.encrypted) return service.setEncrypted(asset.id, false);
    if (asset.label) return service.setEncrypted(asset.id, true);

    const { t } = useI18n();
    return Promise.reject(
      new DetailedError(
        t("error.vault_asset_label_required"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        { id: asset.id, requires: "label" }
      )
    );
  }

  /**
   * Reveals a secret's plaintext — the first no-template-slot capability.
   * `service.decrypt` never caches (`@decision` D8 on
   * `client-notes.services.ts`); this writes the result into the revealed
   * map, which is the ONLY place the plaintext lives client-side.
   */
  async function reveal(id: string): Promise<string> {
    const note = await service.decrypt(id);
    revealed.value = { ...revealed.value, [id]: note };
    return note;
  }

  /** Re-hides a revealed secret — a local flip, no request (row C11 / AC-11). */
  function hide(id: string): void {
    revealed.value = omit(revealed.value, [id]);
  }

  /**
   * Destroys this scoped instance — removes it from the registry so the next
   * `.as()` mints a fresh collection. Clears the revealed-secret map first
   * (row C11/B4): a consumer holding a reference to this scope's `revealed`
   * ref must not keep serving plaintext after the scope it was revealed
   * under is gone. Also unsubscribes the `onLogout` listener (`@decision`
   * B6, above) — a torn-down scope must not leave a dangling subscriber on
   * the module-global logout set.
   */
  function destroy(): void {
    unsubscribeLogout();
    revealed.value = {};
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned yet (clause 2 — fresh modules
  // start armless). When a scope earns one, add
  // `useClientNotes.actions.{actor}.ts` and spread it LAST so it wins.

  return {
    /**
     * @scenario-include
     */
    convert,

    /**
     * @scenario-include
     */
    destroy,

    /**
     * @scenario-include
     */
    filterBy,

    /**
     * @scenario-include
     */
    hide,

    /**
     * @scenario-exclude internal cache-key invalidation, not a user-facing capability
     */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /**
     * @scenario-include
     */
    isReady,

    /**
     * @scenario-include
     */
    nextPage: query.fetchNextPage,

    /**
     * @scenario-include
     */
    prevPage: query.fetchPreviousPage,

    /**
     * @scenario-include
     */
    refresh,

    /**
     * @scenario-include
     */
    remove: service.remove,

    /**
     * @scenario-include
     */
    reveal,

    /**
     * Applies a criteria INTENT — merges the given `filters` / `sort` /
     * `pagination` branches into the ONE query model; branches left out are
     * untouched. This is the door that sets the page size:
     * `setCriteria({ pagination: { limit } })`.
     * @scenario-include
     */
    setCriteria: query.setCriteria,

    /**
     * @scenario-include
     */
    setPinned: service.setPinned,

    /**
     * @scenario-include
     */
    sortBy

    // The arm merges in HERE, last — a spread overwrites, which is what lets
    // it override a shared member; anything it omits falls through.
  };
}

// Type export for consumers
export type UseClientNotesActions = ReturnType<typeof createClientNotesActions>;
