import { watch } from "vue";
import { waitFor } from "xstate/lib/waitFor";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
import {
  DEBOUNCE_DELAY,
  contextValue,
  stateMatches,
  stopService,
  DetailedError,
  ErrorOrigin,
  responseCodes,
  NotAuthenticatedError
} from "../../utils";
import { debounce, get, isEmpty, isEqual } from "lodash-es";
import type {
  ClientPersonalDetailsServices,
  ProfileModel
} from "./client-personal-details.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/usePersonalDetailsManager.actions
 * @description Manager actions — form input, save, revert and lifecycle.
 * Sends events to the shared `dataManagerMachine` and awaits the settled
 * state; never reaches into `state.context` to mutate anything, and never
 * raises feedback. A failure rejects with a `DetailedError` for the CALLER
 * to render, while the machine keeps its own copy in context for
 * `usePersonalDetailsManager.context.ts` to expose.
 *
 * @doctrine clause 2 (fresh modules start armless).
 */
export function createPersonalDetailsManagerActions(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  service: ClientPersonalDetailsServices,
  scopeKey: string
) {
  const { state, send, service: machineService } = actor;
  const { t } = useI18n();

  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /**
   * This scope's settled ADDRESSABILITY outcome, or `undefined` while the
   * session is still settling — the same three-branch shape the read half's
   * `usePersonalDetails.actions.ts` uses.
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
   * @decision AC-42 — gate the editor on the SESSION, not only the machine.
   * what: `isReady()` and `update()` resolve their session outcome here
   *   before waiting on the machine.
   * why: with no client session the shared `dataManagerMachine`'s
   *   `hasSubscription` guard holds it in `subscribing` forever — correct, no
   *   unaddressed request fires — but `isReady()`'s `waitFor(available)` then
   *   only settles on its 30s timeout and `update()`'s only on its 60s one,
   *   rejecting with a `Timeout` rather than the `NotAuthenticatedError` the
   *   read half raises. Reading the session outcome directly settles both the
   *   instant the session is known unaddressable, exactly as the read half
   *   already does (AC-41/54).
   * rejected: moving the `subscribing → unavailable` transition into the
   *   machine — it is the shared, protected `dataManagerMachine`; the gate
   *   belongs in this caller.
   */
  function whenSessionSettles(): Promise<boolean> {
    const settled = addressableOutcome();
    if (settled !== undefined) return Promise.resolve(settled);

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
   * @decision a REAL, bounded timeout — never `Infinity` (AC-40).
   * what:    `isReady()` waits at most 30s for `available`.
   * why:     `useClientEmailManager.actions.ts`'s own `isReady()` uses
   *          `timeout: Infinity`; B diverges deliberately because AC-40
   *          names this file's unbounded wait directly, and a failed
   *          `loadLookups` (a dead client id, or A's collection erroring)
   *          must let this settle `false` rather than hang the caller
   *          forever.
   * rejected: matching `client-email`'s `Infinity` — rejected, it is the
   *          exact defect AC-40 exists to close.
   */
  async function isReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;

    return waitFor(machineService, s => stateMatches(s, "available"), {
      timeout: 30_000
    })
      .then(s => !stateMatches(s, "error"))
      .catch(() => false);
  }

  /** Resolves once the manager has completed a save. */
  async function onDone(): Promise<boolean> {
    return waitFor(
      machineService,
      s => stateMatches(s, ["processed", "complete"]),
      { timeout: 60_000 }
    )
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Inputs a model and resolves the parsed/validated model. Debounced on the
   * way out — the raw function stays private so `update`/`revert` can flush
   * it.
   */
  async function input(
    model: ProfileModel | Record<string, unknown>
  ): Promise<ProfileModel> {
    send({ type: "SET", data: model });

    return waitFor(machineService, s =>
      stateMatches(s, ["available.valid", "available.invalid"])
    )
      .then(s => get(s, "context.model") as ProfileModel)
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

  /** Saves the current (or provided) model and resolves the persisted one. */
  async function update(
    value?: ProfileModel | Record<string, unknown>
  ): Promise<ProfileModel> {
    // No client session → the machine is held in `subscribing` and can never
    // process a save; reject with the module's own typed error rather than
    // hang on the 60s `waitFor` below (AC-42).
    if (!(await whenSessionSettles())) {
      return Promise.reject(new NotAuthenticatedError());
    }

    await debouncedInput.flush()?.catch(() => undefined);

    const model = contextValue<ProfileModel>(state, "model");

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
        return s.context.model as ProfileModel;
      })
      .catch(error =>
        Promise.reject(
          new DetailedError(
            t("error.client_personal_details_update_failed"),
            error?.status ?? responseCodes.Timeout,
            ErrorOrigin.Headless,
            { error, state: state.value }
          )
        )
      );
  }

  /**
   * Restores the base model without a machine change (AC-50, G-12 / R6).
   * `dataManagerMachine` has no `REVERT` event; this is a `SET` carrying
   * `baseModel` through the SAME `input()` pathway, re-entering
   * `available.checking` and re-validating — legacy's own
   * `this.form = _.cloneDeep(this.initialForm)`.
   */
  async function revert(): Promise<ProfileModel> {
    await debouncedInput.flush()?.catch(() => undefined);
    const baseModel = contextValue<ProfileModel>(state, "baseModel") ?? {};
    return input(baseModel);
  }

  /** Clears the current form context. */
  async function clear(): Promise<void> {
    await debouncedInput.flush()?.catch(() => undefined);
    send({ type: "CLEAR" });
  }

  /**
   * Retargets which fields this editor narrows to — the scope-factory-level
   * equivalent of the pre-scope `usePersonalDetailsManager({ filterFields })`
   * option (design.md §8). Sends a REFRESH the shared machine already
   * defines (`data-manager.machine.ts`'s top-level `on.REFRESH`); no machine
   * edit. Re-enters `loading`, which rebuilds the schema/uischema against
   * the new narrowing — call this once, right after construction, before
   * `await isReady()`.
   */
  async function filterFields(fields: string[]): Promise<void> {
    await debouncedInput.flush()?.catch(() => undefined);
    send({ type: "REFRESH", data: { filterFields: fields } });
  }

  /** Stops the underlying machine, leaving the registry entry in place. */
  async function stop(): Promise<void> {
    await debouncedInput.flush()?.catch(() => undefined);
    stopService(machineService);
  }

  /**
   * Destroys this scoped instance — stops the machine AND removes it from
   * the registry.
   */
  async function destroy(): Promise<void> {
    await debouncedInput.flush()?.catch(() => undefined);
    stopService(machineService);
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned yet (clause 2).

  return {
    /** Clears the current form context. */
    clear,

    /** Destroys this scoped instance — stops the machine and deregisters it. */
    destroy,

    /** Retargets which fields this editor narrows to (design.md §8). */
    filterFields,

    /** Inputs a model (debounced), resolving the parsed/validated model. */
    input: debouncedInput,

    /** Resolves true when the manager is ready, false on error or timeout. */
    isReady,

    /** Resolves true once a save has completed. */
    onDone,

    /** Restores the base model — AC-50. */
    revert,

    /** Stops the underlying machine. */
    stop,

    /** Saves the current (or provided) model, resolving the persisted model. */
    update

    // The arm merges in HERE, last.
    // ...actorActions
  };
}

// Type export for consumers
export type UsePersonalDetailsManagerActions = ReturnType<
  typeof createPersonalDetailsManagerActions
>;
