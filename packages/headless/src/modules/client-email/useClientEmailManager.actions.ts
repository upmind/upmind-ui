import { watch } from "vue";
import { waitFor } from "xstate/lib/waitFor";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
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
import type { ClientEmailServices, EmailModel } from "./client-email.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmailManager.actions
 * @description Manager actions — form input, save and lifecycle. Sends events
 * to the shared `dataManagerMachine` and awaits the settled state; it never
 * reaches into `state.context` to mutate anything, and it never raises
 * feedback. A failure rejects with a `DetailedError` for the CALLER to render,
 * while the machine keeps its own copy in context for
 * `useClientEmailManager.context.ts` to expose.
 */
export function createClientEmailManagerActions(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  service: ClientEmailServices,
  scopeKey: string
) {
  const { state, send, service: machineService } = actor;
  const { t } = useI18n();

  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /**
   * This scope's settled ADDRESSABILITY outcome, or `undefined` while the
   * session is still settling — the same three-branch shape the collection
   * half (`useClientEmails.actions.ts`) uses.
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
   * @decision gate the editor on the SESSION, not only the machine.
   * what: `isReady()` and `update()` resolve their session outcome here before
   *   waiting on the machine.
   * why: with no addressable client the shared `dataManagerMachine`'s
   *   `hasSubscription` guard holds it in `subscribing` forever — correct, no
   *   unaddressed request fires — but `isReady()`'s `waitFor(available,
   *   { timeout: Infinity })` then NEVER settles, hanging the caller for good.
   *   Reading the session outcome directly settles it the instant the client is
   *   known unaddressable, exactly as `client-address` / `client-company`
   *   already do (the pre-conversion `timeout: Infinity` hang).
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
   * Resolves when the manager is ready to accept input.
   * @returns true once `available`, false if the machine settled in error or
   * the session settles without an addressable client.
   */
  async function isReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;

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
    // No addressable client → the machine is held in `subscribing` and can
    // never process a save; reject with the module's own typed error rather
    // than hang on the `waitFor` below.
    if (!(await whenSessionSettles())) {
      return Promise.reject(new NotAuthenticatedError());
    }

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
  async function clear(): Promise<void> {
    await debouncedInput.flush()?.catch(() => undefined);
    send({ type: "CLEAR" });
  }

  /** Stops the underlying machine, leaving the registry entry in place. */
  async function stop(): Promise<void> {
    await debouncedInput.flush()?.catch(() => undefined);
    stopService(machineService);
  }

  /**
   * Destroys this scoped instance — stops the machine AND removes it from the
   * registry. The collection's `destroy()` only does the second half, because
   * a query has no service to stop.
   */
  async function destroy(): Promise<void> {
    await debouncedInput.flush()?.catch(() => undefined);
    stopService(machineService);
    removeFromRegistry(scopeKey);
  }

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
  };
}

export type UseClientEmailManagerActions = ReturnType<
  typeof createClientEmailManagerActions
>;
