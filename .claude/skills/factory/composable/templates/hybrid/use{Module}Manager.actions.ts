// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "Actor-Specific
 * Sub-Composables" / "Where Shared Code Lives — NO .base Files" +
 * `code-xstate.md` (canonical state-read APIs) +
 * `code-composables.companion.md` "Variance law" clauses 2/3/5. A disagreement
 * between this skeleton, its worked example, and the doctrine is a surfaced
 * finding, never silently resolved toward either.
 *
 * `@precedent` citations point at the recovered `client-email`
 * (`useClientEmailManager.actions.ts`) and the live `client-phone` manager.
 */

import { waitFor } from "xstate/lib/waitFor";
import { remove as removeFromRegistry } from "../scope";
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
import type { ModuleModel, ModuleServices } from "./module.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module module/useModuleManager.actions
 * @description Manager actions factory (form input, save, lifecycle). Sends
 * events to the shared `dataManagerMachine` and awaits the settled state — it
 * never reaches into `state.context` to mutate anything, and it never raises
 * feedback: a failure rejects with a `DetailedError` for the CALLER to render,
 * while the machine keeps its own copy in context for
 * `useModuleManager.context.ts` to expose.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns ONLY
 * shared members; no `useModuleManager.actions.{actor}.ts` file exists yet.
 */
export function createModuleManagerActions(
  actorScope: ScopeActorTypes,
  actor: UseActor,
  service: ModuleServices,
  scopeKey: string
) {
  const { state, send, service: machineService } = actor;
  const { t } = useI18n();

  /**
   * Resolves when the manager is ready to accept input.
   * @returns true once `available`, false if the machine settled in error.
   */
  async function isReady(): Promise<boolean> {
    return waitFor(machineService, s => stateMatches(s, "available"), {
      timeout: Infinity
    }).then(s => !stateMatches(s, "error"));
  }

  /**
   * Resolves once the manager has completed a save.
   * @returns true on completion, false if it never settled.
   */
  async function onDone(): Promise<boolean> {
    return waitFor(
      machineService,
      s =>
        stateMatches(s, ["processed", "complete"]) ||
        stateValue<boolean>(s, "done", false) === true,
      { timeout: Infinity }
    )
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Inputs a model and resolves to the parsed/validated model. Debounced on the
   * way out (see `input` in the return block) — the raw function is kept
   * private so `update` can flush it.
   */
  async function input(
    model: ModuleModel | Record<string, unknown>
  ): Promise<ModuleModel> {
    send({ type: "SET", data: model });
    // Wait until the model has been checked and is valid/invalid — resolving
    // on `available` alone would return the PRE-parse model.
    return waitFor(machineService, s =>
      stateMatches(s, ["available.valid", "available.invalid"])
    )
      .then(s => get(s, "context.model") as ModuleModel)
      .catch(() =>
        Promise.reject(
          new DetailedError(
            // Replace with this module's real i18n key. The string rides on the
            // rejected error for the CALLER to render; nothing here displays it.
            t("error.input_not_available"),
            responseCodes.Forbidden,
            ErrorOrigin.Headless
          )
        )
      );
  }

  const debouncedInput = debounce(input, DEBOUNCE_DELAY);

  /**
   * Sends the current (or provided) model to the machine for processing, and
   * resolves the persisted model.
   */
  async function update(
    value?: ModuleModel | Record<string, unknown>
  ): Promise<ModuleModel> {
    // Commit any typed input still pending on the debounce before saving,
    // otherwise the save reads the pre-edit model.
    await debouncedInput.flush()?.catch(() => undefined);

    const model = contextValue<ModuleModel>(state, "model");

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
        return s.context.model as ModuleModel;
      })
      .then(saved => {
        // Invalidate through the SCOPED services instance, so the collection
        // this manager belongs to refetches. Never mint a fresh services
        // instance here — that would drop the scope's target client.
        service.refresh();
        return saved;
      })
      .catch(error =>
        Promise.reject(
          new DetailedError(
            // Replace with this module's real i18n key.
            t("error.module_update_failed"),
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

  /** Stops the underlying machine (without removing it from the registry). */
  function stop(): void {
    stopService(machineService);
  }

  /**
   * Destroys this scoped instance — stops the machine AND removes it from the
   * registry. Call on unmount; the collection half's `destroy()` only does the
   * second half, because a query has no service to stop.
   */
  function destroy(): void {
    stopService(machineService);
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned yet (clause 2 — fresh modules start
  // armless). When a scope earns one, add `useModuleManager.actions.{actor}.ts`
  // following the collection half's own arm template
  // (`useModules.actions.{actor}.ts`) and spread it LAST so it wins:
  //   const actorActions =
  //     actorScope === ScopeActorTypes.STAFF
  //       ? createStaffModuleManagerActions(actor, service)
  //       : {};
  // Never a `.base.ts` file (Part B "NO .base Files"); attach a `@decision`
  // block adjacent to the spread the day an arm overrides a shared member.

  return {
    /** Clears the current form context. */
    clear,

    /** Destroys this scoped instance — stops the machine and deregisters it. */
    destroy,

    /** Inputs a model (debounced), resolving to the parsed/validated model. */
    input: debouncedInput,

    /** Resolves true when the manager is ready, false on error. */
    isReady,

    /** Resolves true once a save has completed. */
    onDone,

    /** Stops the underlying machine. */
    stop,

    /** Saves the current (or provided) model, resolving the persisted model. */
    update

    // The arm merges in HERE, last — a spread overwrites, which is what lets
    // it override a shared member; anything it omits falls through.
    // ...actorActions
  };
}

// Type export for consumers
export type UseModuleManagerActions = ReturnType<
  typeof createModuleManagerActions
>;
