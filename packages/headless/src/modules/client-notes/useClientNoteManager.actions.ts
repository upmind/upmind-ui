import { waitFor } from "xstate/lib/waitFor";
// Deep path, never the `../scope` barrel — see useClientNotes.ts for the
// aggregator-barrel `export *` hazard this sidesteps.
import { remove as removeFromRegistry } from "../scope/scope.registry";
import { useI18n } from "../system-localisation";
import {
  DEBOUNCE_DELAY,
  stateValue,
  contextValue,
  stateMatches,
  stopService,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import { debounce, get, isEmpty, isEqual } from "lodash-es";
import type { ClientNoteServices, VaultAssetModel } from "./client-notes.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-notes/useClientNoteManager.actions
 * @description Manager actions — form input, save and lifecycle. Sends events
 * to the shared `dataManagerMachine` and awaits the settled state; it never
 * reaches into `state.context` to mutate anything, and it never raises
 * feedback (the manager half raises none on save, matching the oracle — the
 * modal itself shows no toast). A failure rejects with a `DetailedError` for
 * the CALLER to render, while the machine keeps its own copy in context for
 * `useClientNoteManager.context.ts` to expose.
 *
 * @doctrine clause 2 (fresh modules start armless).
 */
export function createClientNoteManagerActions(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  service: ClientNoteServices,
  scopeKey: string
) {
  const { state, send, service: machineService } = actor;
  const { t } = useI18n();

  /**
   * Resolves when the manager is ready to accept input.
   * @returns true once `available`, false if the machine settled in error.
   *
   * @decision
   * what: bounded at 60s, never `Infinity`.
   * why: `loading` awaits `loadLookups`, which may await a `decrypt` network
   *   call — bounded so a stalled upstream produces a reportable
   *   `responseCodes.Timeout` instead of a silent hang.
   * rejected: `Infinity` — matches the oracle's own choice but leaves a
   *   caller with no way to detect or recover from an upstream stall it does
   *   not own.
   */
  async function isReady(): Promise<boolean> {
    return waitFor(machineService, s => stateMatches(s, "available"), {
      timeout: 60_000
    })
      .then(s => !stateMatches(s, "error"))
      .catch(() =>
        Promise.reject(
          new DetailedError(
            t("error.client_notes_not_available"),
            responseCodes.Timeout,
            ErrorOrigin.Headless
          )
        )
      );
  }

  /**
   * Resolves once the manager has completed a save.
   * @returns true on completion, false if it never settled.
   *
   * @decision
   * what: bounded at 60s, never `Infinity`.
   * why: with `Infinity` the `.catch(() => false)` below can never fire on
   *   timeout, so the documented "false if it never settled" case is
   *   unreachable.
   * rejected: `Infinity` — same rationale as `isReady()`'s bound above.
   */
  async function onDone(): Promise<boolean> {
    return waitFor(
      machineService,
      s =>
        stateMatches(s, ["processed", "complete"]) ||
        stateValue<boolean>(s, "done", false) === true,
      { timeout: 60_000 }
    )
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Inputs a model and resolves the parsed/validated model. Debounced on the
   * way out — the raw function stays private so `update` can flush it.
   */
  async function input(
    model: VaultAssetModel | Record<string, unknown>
  ): Promise<VaultAssetModel> {
    send({ type: "SET", data: model });

    // Waiting on `available` alone would return the PRE-parse model.
    return waitFor(machineService, s =>
      stateMatches(s, ["available.valid", "available.invalid"])
    )
      .then(s => get(s, "context.model") as VaultAssetModel)
      .catch(() =>
        Promise.reject(
          new DetailedError(
            t("error.input_not_available"),
            responseCodes.Forbidden,
            ErrorOrigin.Headless
          )
        )
      );
  }

  const debouncedInput = debounce(input, DEBOUNCE_DELAY);

  /**
   * Saves the current (or provided) model and resolves the persisted one. A
   * fresh draft creates; an asset-scoped manager updates.
   *
   * @decision
   * what: waits for the machine to leave `processed` before sending, when a
   *   save is called while a PRIOR save's `processed` state is still current.
   * why: `processed` (`dataManagerMachine`) has no `SET`/`UPDATE` handler —
   *   it only leaves on its own `after` delay (`useTime().WAIT`). A caller
   *   invoking `update()` a second time immediately after the first resolves
   *   (the shared machine's `waitFor` in this same function settles the
   *   instant `processed` is entered, before that delay fires) would send
   *   into a state with no matching transition: the event is silently
   *   dropped, and the OUTER `waitFor` below then resolves against the
   *   STILL-CURRENT `processed` snapshot from the FIRST save — reporting
   *   success while never having issued a second request. `client-phone`'s
   *   manager carries the identical `update()` shape and the identical
   *   latent gap; no existing manager test exercises two immediate saves
   *   back-to-back, which is why this had no prior receipt.
   * rejected: editing `dataManagerMachine` to add a `processed.on.SET`
   *   handler — the shared, protected core machine backs every scoped
   *   manager in the tree; changing its state chart is out of this module's
   *   write lane and out of this fix's scope.
   */
  async function update(
    value?: VaultAssetModel | Record<string, unknown>
  ): Promise<VaultAssetModel> {
    // Commit any typed input still pending on the debounce before saving,
    // otherwise the save reads the pre-edit model.
    await debouncedInput.flush()?.catch(() => undefined);

    if (stateMatches(state, "processed")) {
      await waitFor(machineService, s => !stateMatches(s, "processed"), {
        timeout: 60_000
      }).catch(() => undefined);
    }

    const model = contextValue<VaultAssetModel>(state, "model");

    if (!isEmpty(value) && !isEqual(value, model)) {
      send({ type: "SET", data: value, update: true });
    } else {
      send({ type: "UPDATE" });
    }

    return waitFor(
      machineService,
      s =>
        stateMatches(s, ["processed", "available.error", "available.invalid"]),
      { timeout: 60_000 }
    )
      .then(s => {
        if (stateMatches(s, ["available.error", "available.invalid"]))
          throw s.context.error;
        return s.context.model as VaultAssetModel;
      })
      .then(saved => {
        // Invalidate through the SCOPED services instance so the collection
        // refetches. Never mint a fresh instance here — that would drop the
        // scope's target client.
        service.refresh();
        return saved;
      })
      .catch(error =>
        Promise.reject(
          new DetailedError(
            t("error.client_notes_update_failed"),
            error?.status ?? responseCodes.Timeout,
            ErrorOrigin.Headless,
            { error, state: state.value }
          )
        )
      );
  }

  /** Clears the current form context. */
  function clear(): void {
    send({ type: "CLEAR" });
  }

  /** Stops the underlying machine, leaving the registry entry in place. */
  function stop(): void {
    debouncedInput.cancel();
    stopService(machineService);
  }

  /**
   * Destroys this scoped instance — stops the machine AND removes it from the
   * registry. The collection's `destroy()` only does the second half, because
   * a query has no service to stop.
   */
  function destroy(): void {
    debouncedInput.cancel();
    stopService(machineService);
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned yet (clause 2). When a scope
  // earns one, add `useClientNoteManager.actions.{actor}.ts` and spread it
  // LAST.

  return {
    /**
     * @scenario-include
     */
    clear,

    /**
     * @scenario-include
     */
    destroy,

    /**
     * @scenario-include
     */
    input: debouncedInput,

    /**
     * @scenario-include
     */
    isReady,

    /**
     * @scenario-include
     */
    onDone,

    /**
     * @scenario-include
     */
    stop,

    /**
     * @scenario-include
     */
    update

    // The arm merges in HERE, last.
  };
}

// Type export for consumers
export type UseClientNoteManagerActions = ReturnType<
  typeof createClientNoteManagerActions
>;
