import { waitFor } from "xstate/lib/waitFor";
import { remove as removeFromRegistry } from "../scope";
import { useI18n } from "../system-localisation";
import {
  DEBOUNCE_DELAY,
  contextValue,
  stateMatches,
  stopService,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import { debounce, get, isEmpty, isEqual } from "lodash-es";
import type { ProfileModel } from "./client-personal-details.types";
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
  scopeKey: string
) {
  const { state, send, service: machineService } = actor;
  const { t } = useI18n();

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
    const baseModel = contextValue<ProfileModel>(state, "baseModel") ?? {};
    return input(baseModel);
  }

  /** Clears the current form context. */
  function clear(): void {
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
  function filterFields(fields: string[]): void {
    send({ type: "REFRESH", data: { filterFields: fields } });
  }

  /** Stops the underlying machine, leaving the registry entry in place. */
  function stop(): void {
    stopService(machineService);
  }

  /**
   * Destroys this scoped instance — stops the machine AND removes it from
   * the registry.
   */
  function destroy(): void {
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
