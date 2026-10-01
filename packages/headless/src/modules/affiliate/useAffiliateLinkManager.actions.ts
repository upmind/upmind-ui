import { waitFor } from "xstate/lib/waitFor";
import { remove as removeFromRegistry } from "../scope/scope.registry";
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
import { debounce, isEmpty, isEqual } from "lodash-es";
import type { AffiliateLinkFormModel } from "./affiliate.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateLinkManager.actions
 * @description Manager actions — form input, save and lifecycle.
 */

const READINESS_TIMEOUT_MS = 15_000;

export function createAffiliateLinkManagerActions(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  scopeKey: string
) {
  const { state, send, service: machineService } = actor;
  const { t } = useI18n();

  /**
   * @decision the readiness wait settles on EITHER `available` or
   * `unavailable`, never on `available` alone.
   * what: `waitFor(..., s => stateMatches(s, ["available", "unavailable"]))`,
   *      resolving `true` only for a non-error `available`.
   * why: a non-CLIENT scope actor, or an editor whose pin never arrives,
   *      settles the machine straight into `unavailable` (design.md §8.4
   *      Editors rule 5: "the machine goes to `unavailable` with no
   *      request" — a DELIBERATE, immediate terminal outcome, not a stall).
   *      Waiting on `available` alone left `isReady()` polling the FULL
   *      {@link READINESS_TIMEOUT_MS} for a transition that was never
   *      coming, rejecting every caller at the timeout instead of resolving
   *      `false` at once (F-2: `affiliate.cell-boundary`'s STAFF/GUEST
   *      cases).
   * rejected: a synchronous `stateMatches(state.value, "unavailable")`
   *      short-circuit ahead of the wait — `subscribing` (a CLIENT editor
   *      still waiting on its pin) is loading, not settled (design.md §8.4
   *      Editors rule 6), so an early check would wrongly resolve while a
   *      real pin is still in flight.
   */
  function whenSettled(): Promise<boolean> {
    return waitFor(
      machineService,
      s => stateMatches(s, ["available", "unavailable"]),
      { timeout: READINESS_TIMEOUT_MS }
    )
      .then(s => stateMatches(s, "available") && !stateMatches(s, "error"))
      .catch(error =>
        Promise.reject(
          new DetailedError(
            t("error.affiliate_link_form_timeout"),
            responseCodes.Timeout,
            ErrorOrigin.Headless,
            { error, state: state.value }
          )
        )
      );
  }

  /** Resolves once the manager settles `available` or `unavailable`; rejects at the readiness bound. */
  async function isReady(): Promise<boolean> {
    return whenSettled();
  }

  async function input(
    model: AffiliateLinkFormModel | Record<string, unknown>
  ): Promise<AffiliateLinkFormModel> {
    send({ type: "SET", data: model });
    return waitFor(machineService, s =>
      stateMatches(s, ["available.valid", "available.invalid"])
    )
      .then(s => s.context.model as AffiliateLinkFormModel)
      .catch(() =>
        Promise.reject(
          new DetailedError(
            t("error.affiliate_link_not_available"),
            responseCodes.Forbidden,
            ErrorOrigin.Headless
          )
        )
      );
  }

  const debouncedInput = debounce(input, DEBOUNCE_DELAY);

  async function update(
    value?: AffiliateLinkFormModel | Record<string, unknown>
  ): Promise<AffiliateLinkFormModel> {
    await debouncedInput.flush()?.catch(() => undefined);

    const model = contextValue<AffiliateLinkFormModel>(state, "model");

    const retrying = stateMatches(state, ["available.error"]);
    if (!isEmpty(value) && !isEqual(value, model)) {
      send({ type: "SET", data: value, update: true });
    } else if (retrying) {
      send({ type: "SET", data: model, update: true });
    } else {
      send({ type: "UPDATE" });
    }

    /**
     * @decision a settled `available.error`/`available.invalid` RESOLVES with
     * the context model, never rejects.
     * what: drops the `throw s.context.error` branch this `waitFor` used to
     *      take on a settled failure state; only the `waitFor` itself
     *      timing out (the machine never settling at all) still rejects.
     * why: design.md §8.2 "Failure surface": "Errors are state, not events...
     *      No action below rejects on a server failure" (D-33) — a 422/5xx
     *      fills `errors` in context (readable via `useContext().errors`)
     *      and the manager returns to `available`; the CALLER reads
     *      `useMeta().hasError`/`hasErrors`, it does not catch a throw
     *      (F-2: `affiliate.link-create`/`link-edit`'s refused-save cases).
     * rejected: keeping the throw for `available.invalid` only — this
     *      config's `validate` service never rejects (`Promise.resolve(
     *      undefined)`), so `invalid` is unreachable here; a split branch
     *      for a state this machine never enters would be untestable dead
     *      code.
     */
    return waitFor(
      machineService,
      s =>
        stateMatches(s, ["processed", "available.error", "available.invalid"]),
      { timeout: 60_000 }
    )
      .then(s => s.context.model as AffiliateLinkFormModel)
      .catch(() =>
        Promise.reject(
          new DetailedError(
            t("error.affiliate_link_form_timeout"),
            responseCodes.Timeout,
            ErrorOrigin.Headless,
            { state: state.value }
          )
        )
      );
  }

  /** Resolves true once a save has completed, false if it never settles. */
  async function onDone(): Promise<boolean> {
    return waitFor(
      machineService,
      s => stateMatches(s, ["processed", "complete"]),
      { timeout: 60_000 }
    )
      .then(() => true)
      .catch(() => false);
  }

  /** Restores the base model through `input`; the machine has no `REVERT` event. */
  async function revert(): Promise<AffiliateLinkFormModel> {
    const baseModel =
      contextValue<AffiliateLinkFormModel>(state, "baseModel") ?? {};
    return input(baseModel);
  }

  /** Stops the underlying machine, leaving the registry entry in place. */
  function stop(): void {
    stopService(machineService);
  }

  function clear(): void {
    send({ type: "CLEAR" });
  }

  function destroy(): void {
    stopService(machineService);
    removeFromRegistry(scopeKey);
  }

  return {
    clear,
    destroy,
    input: debouncedInput,
    isReady,
    onDone,
    revert,
    stop,
    update
  };
}

export type UseAffiliateLinkManagerActions = ReturnType<
  typeof createAffiliateLinkManagerActions
>;
