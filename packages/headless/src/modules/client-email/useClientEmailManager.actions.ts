import { waitFor } from "xstate/lib/waitFor";
import { remove as removeFromRegistry } from "../scope";
import { useI18n } from "../system-localisation";
import { useClientEmailServices } from "./client-email.services";
import {
  DEBOUNCE_DELAY,
  stateValue,
  ErrorOrigin,
  contextValue,
  stateMatches,
  DetailedError,
  responseCodes,
  stopService
} from "../../utils";
import { debounce, get, isEmpty, isEqual } from "lodash-es";
import type { EmailModel } from "./client-email.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmailManager.actions
 * @description Client-email manager actions factory (form input, save, and
 * lifecycle). Sends events to the shared `dataManagerMachine`.
 */

/**
 * Creates the client-email manager actions (machine events + lifecycle).
 * @internal
 */
export function createClientEmailManagerActions(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  scopeKey: string
) {
  const { state, send, service } = actor;
  const { t } = useI18n();

  /**
   * Resolves when the manager is ready to accept input.
   * @returns Resolves true if ready, false if the machine errored.
   */
  async function isReady(): Promise<boolean> {
    return waitFor(service, s => stateMatches(s, "available"), {
      timeout: Infinity
    }).then(s => !stateMatches(s, "error"));
  }

  /**
   * Resolves once the manager has completed a save (processed/complete/done).
   * @returns Resolves true on completion, false if it never settled.
   */
  async function onDone(): Promise<boolean> {
    return waitFor(
      service,
      s =>
        stateMatches(s, ["processed", "complete"]) ||
        stateValue<boolean>(s, "done", false) === true,
      { timeout: Infinity }
    )
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Inputs a model and resolves to the parsed/validated model. Debounced.
   */
  async function input(
    model: EmailModel | Record<string, any>
  ): Promise<EmailModel> {
    send({ type: "SET", data: model });
    // wait until the model has been checked and is valid/invalid
    return waitFor(service, s =>
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
   * Sends the current (or provided) model to the service for processing.
   */
  async function update(
    value?: EmailModel | Record<string, any>
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

    // ensure the update is processed and settled
    return waitFor(
      service,
      s =>
        stateMatches(s, ["processed", "available.error", "available.invalid"]),
      { timeout: 60_000 }
    )
      .then(s => {
        if (stateMatches(s, ["available.error", "available.invalid"]))
          throw s.context.error;
        return Promise.resolve(s.context.model);
      })
      .then(model => {
        useClientEmailServices().refresh();
        return model as EmailModel;
      })
      .catch(error =>
        Promise.reject(
          new DetailedError(
            t("error.client_email_update_failed"),
            error?.status ?? responseCodes.Timeout,
            ErrorOrigin.Headless,
            {
              error,
              state: state.value
            }
          )
        )
      );
  }

  /** Clears the current form context. */
  function clear(): void {
    send({ type: "CLEAR" });
  }

  /** Stops the underlying service (without removing it from the registry). */
  function stop(): void {
    stopService(service);
  }

  /**
   * Destroys this scoped instance — stops the service AND removes it from the
   * registry. Call on component unmount to fully clean up.
   */
  function destroy(): void {
    stopService(service);
    removeFromRegistry(scopeKey);
  }

  // ---------------------------------------------------------------------------
  return {
    /** Clears the current form context. */
    clear,

    /** Destroys this scoped instance — stops the service and removes it from the registry. */
    destroy,

    /** Inputs a model (debounced), resolving to the parsed/validated model. */
    input: debouncedInput,

    /** Resolves true when the manager is ready, false on error. */
    isReady,

    /** Resolves true once a save has completed. */
    onDone,

    /** Stops the underlying service. */
    stop,

    /** Saves the current (or provided) model, resolving the persisted model. */
    update
  };
}

// Type export for consumers
export type UseClientEmailManagerActions = ReturnType<
  typeof createClientEmailManagerActions
>;
