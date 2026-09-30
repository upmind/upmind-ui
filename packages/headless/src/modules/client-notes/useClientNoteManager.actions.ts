import { watch } from "vue";
import { waitFor } from "xstate/lib/waitFor";
import { BrandConfigKeys } from "@upmind-automation/types";
import { useBrand } from "../brand";
// Deep path, never the `../scope` barrel — see useClientNotes.ts for the
// aggregator-barrel `export *` hazard this sidesteps.
import { remove as removeFromRegistry } from "../scope/scope.registry";
import { useActiveSession, useSessionStore } from "../session-store";
import { useI18n } from "../system-localisation";
import { clearManagerContextOnLogout } from "./useClientNoteManager.machine";
import {
  DEBOUNCE_DELAY,
  stateValue,
  contextValue,
  stateMatches,
  stopService,
  DetailedError,
  ErrorOrigin,
  responseCodes,
  NotAuthenticatedError
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
   * @decision D16 (R6 — supersedes the destroy()-only shape; this record
   *   previously described that shape as if it were sufficient — it was not)
   * what: subscribes to `useSessionStore().useActions().onLogout(...)`, and
   *   on fire, FIRST clears `context.model` AND `context.baseModel` via
   *   `clearManagerContextOnLogout` (`useClientNoteManager.machine.ts`
   *   `@decision` D19), THEN calls `destroy()`. `unsubscribeLogout()` is
   *   still called from BOTH `stop()` and `destroy()` below.
   * why: the collection clears because its plaintext lives in a CLOSURE
   *   (`revealed`, `useClientNotes.actions.ts` `@decision` B6); the
   *   manager's plaintext lives in MACHINE CONTEXT — `context.model.note`
   *   AND `context.baseModel.note`, both seeded by `client-notes.services.ts`'s
   *   `loadLookups`. XState v4 keeps a STOPPED interpreter's `state.context`
   *   readable by any consumer still holding the actor handle — `destroy()`
   *   drops the REGISTRY's reference, never a retained CONSUMER's. Order
   *   matters: the clear runs BEFORE `destroy()`, not after, because
   *   `Interpreter.stop()` (XState v4) unsubscribes every listener
   *   SYNCHRONOUSLY before it settles its own final state, so a clear issued
   *   after `destroy()` would never reach a live `@xstate/vue`-backed
   *   `useContext()` read — see D19 for the full mechanics.
   * rejected: two prior shapes, both disproven, not two working steps —
   *   1. Extending `clearModel`/`CLEAR` to also empty `baseModel` — changes
   *      `CLEAR`'s semantics for every consumer of the shared machine (a
   *      `.for('client-note', id)` editor's `clear()` would EMPTY instead of
   *      resetting to the record), and breaks R3's `?? cloneDeep(model)`
   *      fallback and `isDirty`. BINDING PROHIBITION, operator ruling
   *      `ruling-manager-logout-teardown`, 2026-08-31, tier-1 — unchanged,
   *      `CLEAR`/`clearModel` are still untouched by D19.
   *   2. `destroy()` alone (`stop()` + registry removal + `onLogout`
   *      unsubscribe, no context clear) — this module's OWN first fix.
   *      Halts the interpreter (`service.status` flips to `2`/Stopped) but
   *      does NOT clear `state.context`: a real `logout()` run against a
   *      RETAINED handle showed `useContext().model.note` and
   *      `context.baseModel.note` both still returning the plaintext after
   *      `destroy()` ran. This is the second failed shape, proven wrong by
   *      that exact repro, not a correct baseline this record should read
   *      as having ever worked.
   * accepted consequence (unchanged): a consumer holding a manager handle
   *   across a logout gets a dead, emptied scope — correct, since the client
   *   it was editing for is gone.
   */
  const { onLogout } = useSessionStore().useActions();
  const unsubscribeLogout = onLogout(() => {
    clearManagerContextOnLogout(state.value.context);
    destroy();
  });

  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /**
   * This scope's settled ADDRESSABILITY outcome, or `undefined` while the
   * session is still settling — the same three-branch shape the collection
   * half (`useClientNotes.actions.ts`) uses.
   */
  function addressableOutcome(): boolean | undefined {
    if (service.isAvailable.value) return true;
    if (isSessionInitialised.value || !isSessionSettling.value) return false;
    return undefined;
  }

  /**
   * Resolves the addressability outcome, waiting only while the session is
   * still settling; self-stopping.
   *
   * @decision gate the editor on the SESSION and the VAULT GATE, not only the
   * machine.
   * what: `isReady()` and `update()` resolve their addressability here before
   *   waiting on the machine. `useBrand().ensureConfig(...)` is awaited FIRST,
   *   exactly as the collection half's B5 gate and the services'
   *   `ensureAddressable` do.
   * why: with no addressable client (signed out, or the brand's vault gate
   *   OFF) the shared `dataManagerMachine` never leaves `subscribing`/`loading`
   *   for `available`, so `isReady()` only settled on its 60s `waitFor` and
   *   `update()` on its own — a hang that contaminates any sibling scenario
   *   sharing the suite. `service.isAvailable` folds in `isVaultEnabled()`,
   *   read SYNCHRONOUSLY off cached config, so the `ensureConfig` await is what
   *   stops a freshly-minted editor reading a not-yet-loaded gate and settling
   *   a premature `false` (the collection's B5 defect, reproduced here).
   * rejected: moving the transition into the machine — it is the shared,
   *   protected `dataManagerMachine`; the gate belongs in this caller. Reading
   *   `service.isAvailable` without the `ensureConfig` await — reintroduces B5.
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
    if (!(await whenSessionSettles())) return false;

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
    // No addressable client (signed out, or the vault gate OFF) → the machine
    // never reaches a save-able state; reject with the module's own typed error
    // rather than hang on the `waitFor` below.
    if (!(await whenSessionSettles())) {
      return Promise.reject(new NotAuthenticatedError());
    }

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
  async function clear(): Promise<void> {
    await debouncedInput.flush()?.catch(() => undefined);
    send({ type: "CLEAR" });
  }

  /**
   * Stops the underlying machine, leaving the registry entry in place.
   * Unsubscribes the `onLogout` listener (`@decision` D16, above) — a
   * stopped-but-not-destroyed scope must not leave a dangling subscriber on
   * the module-global logout set.
   *
   * @decision D20 (FE-3145 — the flush-before-teardown rule; this module is
   *   the one exception to it)
   * what:     `stop()` and `destroy()` keep `debouncedInput.cancel()` — they
   *   DISCARD a pending input rather than flushing it, unlike every other
   *   manager under FE-3145.
   * why:      the pending input carries the plaintext note; `destroy()` is the
   *   logout-teardown sink (D16 — `onLogout` clears `model`+`baseModel` then
   *   calls `destroy()`). Flushing would re-send `SET` with that plaintext
   *   INTO the machine AFTER the clear and just before `stopService`, leaving
   *   it readable on the stopped interpreter's `state.context` — the exact
   *   leak D16 (operator ruling `ruling-manager-logout-teardown`, tier-1)
   *   closes. `cancel()` already prevents the "SET into stopped service"
   *   error FE-3145 targets, so no defect is left open.
   * rejected: flushing per the FE-3145 default — regresses the tier-1 D16
   *   plaintext guarantee; the two operator authorities conflict here and the
   *   security ruling wins.
   */
  function stop(): void {
    unsubscribeLogout();
    debouncedInput.cancel();
    stopService(machineService);
  }

  /**
   * Destroys this scoped instance — stops the machine AND removes it from the
   * registry. The collection's `destroy()` only does the second half, because
   * a query has no service to stop. Also unsubscribes the `onLogout` listener
   * (`@decision` D16, above) — a torn-down scope must not leave a dangling
   * subscriber on the module-global logout set. Keeps `cancel()` over flush —
   * see `stop()`'s `@decision` D20.
   */
  function destroy(): void {
    unsubscribeLogout();
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
