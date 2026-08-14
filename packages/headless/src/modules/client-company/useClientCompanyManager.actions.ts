import { watch } from "vue";
import { waitFor } from "xstate/lib/waitFor";
import { remove as removeFromRegistry } from "../scope/scope.registry";
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
import type {
  ClientCompanyServices,
  CompanyModel
} from "./client-company.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-company/useClientCompanyManager.actions
 * @description Manager actions — form input, save and lifecycle. Sends
 * events to the shared `dataManagerMachine` and awaits the settled state; it
 * never reaches into `state.context` to mutate anything, and it never raises
 * feedback. A failure rejects with a `DetailedError` for the CALLER to
 * render, while the machine keeps its own copy in context for
 * `useClientCompanyManager.context.ts` to expose.
 *
 * @doctrine clause 2 (fresh modules start armless).
 */
export function createClientCompanyManagerActions(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  service: ClientCompanyServices,
  scopeKey: string
) {
  const { state, send, service: machineService } = actor;
  const { t } = useI18n();
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /**
   * This scope's settled ADDRESSABILITY outcome, or `undefined` while the
   * session is still settling. Mirrors the collection's
   * `useClientCompanies.actions.ts` shape (NFR-3) — reading `service.isAvailable`
   * makes "ready to input" and "will ever reach `available`" the same question,
   * so readiness cannot wait on a machine transition that is not coming.
   */
  function addressableOutcome(): boolean | undefined {
    if (service.isAvailable.value) return true;
    if (isSessionInitialised.value || !isSessionSettling.value) return false;
    return undefined;
  }

  /**
   * Resolves the addressability outcome, waiting only while the session is
   * still settling.
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
   * Resolves once the machine reaches `available` — only ever awaited once
   * the session has settled addressable, so `hasSubscription` is not gating
   * it shut (closes the pre-conversion `timeout: Infinity` hang, NFR-3).
   */
  function whenAvailable(): Promise<boolean> {
    return waitFor(machineService, s => stateMatches(s, "available"), {
      timeout: Infinity
    }).then(s => !stateMatches(s, "error"));
  }

  /**
   * Resolves when the manager is ready to accept input.
   * @returns true once `available`, false if the session settles without an
   * addressable client or the machine settled in error.
   */
  async function isReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;

    return whenAvailable();
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
    model: CompanyModel | Record<string, unknown>
  ): Promise<CompanyModel> {
    send({ type: "SET", data: model });

    // Waiting on `available` alone would return the PRE-parse model.
    return waitFor(machineService, s =>
      stateMatches(s, ["available.valid", "available.invalid"])
    )
      .then(s => get(s, "context.model") as CompanyModel)
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
   * fresh draft creates; a company-scoped manager updates.
   */
  async function update(
    value?: CompanyModel | Record<string, unknown>
  ): Promise<CompanyModel> {
    // Fails fast rather than leaving a never-authenticated session waiting on
    // the 60s timeout below: an unaddressable session holds the machine in
    // `subscribing` forever (the `hasSubscription` guard never passes), so
    // without this the promise would settle only on a generic TIMEOUT after a
    // minute instead of `NotAuthenticatedError` promptly (AC-25).
    if (!service.isAvailable.value) throw new NotAuthenticatedError();

    // Commit any typed input still pending on the debounce before saving,
    // otherwise the save reads the pre-edit model.
    await debouncedInput.flush()?.catch(() => undefined);

    const model = contextValue<CompanyModel>(state, "model");

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
        return s.context.model as CompanyModel;
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
          // `error.client_company_update_failed` — the pre-conversion
          // `useClientCompanyManager.ts` L194 rejected with
          // `error.client_email_update_failed`, an EMAIL key on the company
          // module (AC-23, `parity.yaml` C29).
          new DetailedError(
            t("error.client_company_update_failed"),
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
   * Destroys this scoped instance — stops the machine AND removes it from
   * the registry. The collection's `destroy()` only does the second half,
   * because a query has no service to stop. Replaces the pre-conversion
   * `stop()` (`parity.yaml` C30).
   */
  function destroy(): void {
    stopService(machineService);
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned yet (clause 2). When a scope
  // earns one, add `useClientCompanyManager.actions.{actor}.ts` and spread it
  // LAST.

  return {
    /** Clears the current form context. */
    clear,

    /** Destroys this scoped instance — stops the machine and deregisters it. */
    destroy,

    /** Inputs a model (debounced), resolving the parsed/validated model. */
    input: debouncedInput,

    /** Resolves true when the manager is ready, false on error. */
    isReady,

    /** Resolves true once a save has completed. */
    onDone,

    /** Stops the underlying machine. */
    stop,

    /** Saves the current (or provided) model, resolving the persisted model. */
    update

    // The arm merges in HERE, last.
    // ...actorActions
  };
}

// Type export for consumers
export type UseClientCompanyManagerActions = ReturnType<
  typeof createClientCompanyManagerActions
>;
