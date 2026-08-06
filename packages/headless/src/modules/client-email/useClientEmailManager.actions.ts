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
import type { ClientEmailServices, EmailModel } from "./client-email.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmailManager.actions
 * @description Manager actions — form input, save and lifecycle. Sends events
 * to the shared `dataManagerMachine` and awaits the settled state; it never
 * reaches into `state.context` to mutate anything, and it never raises
 * feedback. A failure rejects with a `DetailedError` for the CALLER to render,
 * while the machine keeps its own copy in context for
 * `useClientEmailManager.context.ts` to expose.
 *
 * @doctrine clause 2 (fresh modules start armless).
 */
export function createClientEmailManagerActions(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  service: ClientEmailServices,
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
   * Inputs a model and resolves the parsed/validated model. Debounced on the
   * way out — the raw function stays private so `update` can flush it.
   */
  async function input(
    model: EmailModel | Record<string, unknown>
  ): Promise<EmailModel> {
    send({ type: "SET", data: model });

    // Waiting on `available` alone would return the PRE-parse model.
    return waitFor(machineService, s =>
      stateMatches(s, ["available.valid", "available.invalid"])
    )
      .then(s => get(s, "context.model") as EmailModel)
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
   * Saves the current (or provided) model and resolves the persisted one.
   * A fresh draft creates; an email-scoped manager updates.
   */
  async function update(
    value?: EmailModel | Record<string, unknown>
  ): Promise<EmailModel> {
    // Commit any typed input still pending on the debounce before saving,
    // otherwise the save reads the pre-edit model.
    await debouncedInput.flush()?.catch(() => undefined);

    const model = contextValue<EmailModel>(state, "model");

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
        return s.context.model as EmailModel;
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
            t("error.client_email_update_failed"),
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
    stopService(machineService);
  }

  /**
   * Destroys this scoped instance — stops the machine AND removes it from the
   * registry. The collection's `destroy()` only does the second half, because
   * a query has no service to stop.
   */
  function destroy(): void {
    stopService(machineService);
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned yet (clause 2). When a scope earns
  // one, add `useClientEmailManager.actions.{actor}.ts` and spread it LAST.

  return {
    /**
     * Clears the current form context.
     * @scenario-include
     */
    clear,

    /**
     * Destroys this scoped instance — stops the machine and deregisters it.
     * @scenario-include
     */
    destroy,

    /**
     * Inputs a model (debounced), resolving the parsed/validated model.
     * @scenario-include
     */
    input: debouncedInput,

    /**
     * Resolves true when the manager is ready, false on error.
     * @scenario-include
     */
    isReady,

    /**
     * Resolves true once a save has completed.
     * @scenario-include
     */
    onDone,

    /**
     * Stops the underlying machine.
     * @scenario-include
     */
    stop,

    /**
     * Saves the current (or provided) model, resolving the persisted model.
     * @scenario-include
     */
    update

    // The arm merges in HERE, last.
    // ...actorActions
  };
}

// Type export for consumers
export type UseClientEmailManagerActions = ReturnType<
  typeof createClientEmailManagerActions
>;
