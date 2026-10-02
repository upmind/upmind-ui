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
 * @module client-personal-details/usePersonalDetails.actions
 * @description Manager actions — form input, save, revert and lifecycle.
 * Sends events to the shared `dataManagerMachine` and awaits the settled
 * state; never reaches into `state.context` to mutate anything, and never
 * raises feedback. A failure rejects with a `DetailedError` for the CALLER
 * to render, while the machine keeps its own copy in context for
 * `usePersonalDetails.context.ts` to expose.
 *
 * @doctrine clause 2 (fresh modules start armless).
 */
export function createPersonalDetailsActions(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  service: ClientPersonalDetailsServices,
  scopeKey: string
) {
  const { state, send, service: machineService } = actor;
  const { t } = useI18n();

  /**
   * Gates the editor on the SESSION, not only the machine (AC-42): with no
   * client session the shared `dataManagerMachine`'s `hasSubscription` guard
   * holds it in `subscribing` forever, so `isReady()`/`update()` would only
   * settle on their `waitFor` timeouts. Awaits the session-store's OWN
   * readiness (`session.useActions().isReady()`) rather than a hand-built
   * watcher, then reports this scope's addressability.
   */
  async function whenSessionSettles(): Promise<boolean> {
    await useActiveSession().useActions().isReady();
    return service.isAvailable.value;
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
   * equivalent of the pre-scope `usePersonalDetails({ filterFields })`
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

  /**
   * Re-reads the profile — the read half's `refresh` (AC-52). Sends the
   * shared machine's top-level `REFRESH`, which re-enters `loading` and
   * re-runs `loadLookups`, then awaits the settled read.
   */
  async function refresh(): Promise<boolean> {
    await debouncedInput.flush()?.catch(() => undefined);
    send({ type: "REFRESH" });
    return isReady();
  }

  /**
   * Drops this scope's record cache entry and re-drives the machine through
   * its top-level `REFRESH` (`loading` → `loadLookups`), so the form asks
   * again through whatever transport answers — the redial the labs force
   * handle needs (`useForcedState`: "the preset is only visible because the
   * page asks again"). `refresh()` alone cannot serve this: the record read
   * is `staleTime: DAY`, so `REFRESH` re-reads the still-fresh cached success
   * and the armed transport is never requested. `reset`, not `invalidate`:
   * an entry removed redraws from `loading`; one invalidated keeps stale rows.
   *
   * `CLEAR` precedes `REFRESH` so the re-read starts from an empty record.
   * `REFRESH` alone re-enters `loading` keeping the last `model` in context, so
   * a failed re-read settles `unavailable` still holding the previous live
   * record and the surface draws it. `CLEAR` drops that model first; a
   * successful load's `setContext` repopulates it, a failed one shows none.
   */
  async function reset(): Promise<void> {
    await debouncedInput.flush()?.catch(() => undefined);
    await service.reset();
    send({ type: "CLEAR" });
    send({ type: "REFRESH" });
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

    /** Marks this scope's record read stale so the next read refetches, keeping the rows. */
    invalidate: service.invalidate,

    /** Resolves true when the manager is ready, false on error or timeout. */
    isReady,

    /** Resolves true once a save has completed. */
    onDone,

    /** Re-reads the profile — re-enters loading and re-runs the record read (AC-52). */
    refresh,

    /** Drops the record cache and re-drives the machine — the force handle's redial. */
    reset,

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
export type UsePersonalDetailsActions = ReturnType<
  typeof createPersonalDetailsActions
>;
