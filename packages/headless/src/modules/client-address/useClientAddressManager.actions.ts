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
  AddressModel,
  ClientAddressServices
} from "./client-address.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-address/useClientAddressManager.actions
 * @description Manager actions — form input, save and lifecycle. Sends events
 * to the shared `dataManagerMachine` and awaits the settled state; it never
 * reaches into `state.context` to mutate anything. A save failure rejects with
 * a `DetailedError` for the CALLER to render, while the machine keeps its own
 * copy in context for `useClientAddressManager.context.ts` to expose. (The
 * module's own feedback raises live on the COLLECTION's `remove` /
 * `setDefault` — operator ruling R10; the form half raises nothing.)
 *
 * @doctrine clause 2 (fresh modules start armless).
 */

/**
 * The editor's readiness bound. Replaces the pre-conversion
 * `waitFor(…, { timeout: Infinity })` (`useClientAddressManager.ts` L90-93),
 * which hung silently forever. This module — unlike the `client-email`
 * exemplar, which still uses `Infinity` — awaits `useSystem().isReady()` and
 * `useBrand().ensureConfig()` inside `loadLookups`, and BOTH poll uncapped
 * intervals gated on leaked query singletons (hazard Z2). A session-settled
 * gate alone therefore cannot bound this wait; only a real timeout can. The
 * shared polls are protected-adjacent and are NOT touched — the hazard is
 * contained at this module's boundary (`design.md` D-10 / AC-26).
 */
const READINESS_TIMEOUT_MS = 15_000;

export function createClientAddressManagerActions(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  service: ClientAddressServices,
  scopeKey: string
) {
  const { state, send, service: machineService } = actor;
  const { t } = useI18n();
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /**
   * This scope's settled ADDRESSABILITY outcome, or `undefined` while the
   * session is still settling. Mirrors the collection's shape — reading
   * `service.isAvailable` makes "ready to input" and "will ever reach
   * `available`" the same question, so readiness cannot wait on a machine
   * transition that is not coming.
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
   * Resolves once the machine reaches `available`, or rejects with a catchable
   * `DetailedError` at {@link READINESS_TIMEOUT_MS}.
   *
   * The expiry names the TIMEOUT rather than reusing the module's generic
   * "not available" key: a form whose lookups never answered and a form that
   * resolved unusable are different failures, and a consumer that cannot tell
   * them apart cannot offer a retry (AC-26).
   */
  function whenAvailable(): Promise<boolean> {
    return waitFor(machineService, s => stateMatches(s, "available"), {
      timeout: READINESS_TIMEOUT_MS
    })
      .then(s => !stateMatches(s, "error"))
      .catch(error =>
        Promise.reject(
          new DetailedError(
            t("error.client_address_form_timeout"),
            responseCodes.Timeout,
            ErrorOrigin.Headless,
            { error, state: state.value }
          )
        )
      );
  }

  /**
   * Resolves when the manager is ready to accept input.
   * @returns true once `available`, false if the session settles without an
   * addressable client.
   * @throws {DetailedError} when the lookup chain has not settled within the
   * readiness bound.
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
      { timeout: READINESS_TIMEOUT_MS }
    )
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Inputs a model and resolves the parsed/validated model. Debounced on the
   * way out — the raw function stays private so `update` can flush it.
   *
   * A PARTIAL payload has every omitted key filled from the form-open snapshot,
   * not from the current model, so partial calls do not accumulate: send the
   * whole model, or fold your own partial into the one this resolves.
   */
  async function input(
    model: AddressModel | Record<string, unknown>
  ): Promise<AddressModel> {
    send({ type: "SET", data: model });

    // Waiting on `available` alone would return the PRE-parse model.
    return waitFor(machineService, s =>
      stateMatches(s, ["available.valid", "available.invalid"])
    )
      .then(s => get(s, "context.model") as AddressModel)
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
   * fresh draft creates; an address-scoped manager updates, sending only the
   * fields that changed since the form opened (`parity.yaml` L3 / AC-23).
   */
  async function update(
    value?: AddressModel | Record<string, unknown>
  ): Promise<AddressModel> {
    // Fails fast rather than leaving a never-authenticated session waiting on
    // the 60s timeout below: an unaddressable session holds the machine in
    // `subscribing` forever (the `hasSubscription` guard never passes).
    if (!service.isAvailable.value) throw new NotAuthenticatedError();

    // Commit any typed input still pending on the debounce before saving,
    // otherwise the save reads the pre-edit model.
    await debouncedInput.flush()?.catch(() => undefined);

    const model = contextValue<AddressModel>(state, "model");

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
        return s.context.model as AddressModel;
      })
      .then(saved => {
        // Invalidate through the SCOPED services instance so the collection
        // refetches (AC-15). Never mint a fresh instance here — that would drop
        // the scope's target client.
        service.refresh();
        return saved;
      })
      .catch(error =>
        Promise.reject(
          new DetailedError(
            t("error.client_address_update_failed"),
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
  // one, add `useClientAddressManager.actions.{actor}.ts` and spread it LAST.

  return {
    /** Clears the current form context. */
    clear,

    /** Destroys this scoped instance — stops the machine and deregisters it. */
    destroy,

    /** Inputs a model (debounced), resolving the parsed/validated model. */
    input: debouncedInput,

    /** Resolves true when the manager is ready; rejects at the readiness bound. */
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
export type UseClientAddressManagerActions = ReturnType<
  typeof createClientAddressManagerActions
>;
