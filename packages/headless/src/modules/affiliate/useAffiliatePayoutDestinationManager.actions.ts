import { waitFor } from "xstate/lib/waitFor";
import { remove as removeFromRegistry } from "../scope/scope.registry";
import { useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
import { loadAffiliateClientEmails } from "./affiliate.services";
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
import type { AffiliatePayoutDestinationFormModel } from "./affiliate.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { IEmail } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliatePayoutDestinationManager.actions
 * @description Manager actions — form input, save, `addEmail` and lifecycle
 * (design.md §8.6).
 */

const READINESS_TIMEOUT_MS = 15_000;

export function createAffiliatePayoutDestinationManagerActions(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  scopeKey: string
) {
  const { state, send, service: machineService } = actor;
  const { t } = useI18n();

  /**
   * The wait settles on EITHER `available` or `unavailable` — a non-CLIENT
   * scope actor, or an editor whose pin never arrives, settles the machine
   * straight into `unavailable` (design.md §8.4 Editors rule 5), a
   * deliberate, immediate terminal outcome. Waiting on `available` alone
   * left `isReady()` polling the full {@link READINESS_TIMEOUT_MS} for a
   * transition that was never coming (F-2: `affiliate.cell-boundary`'s
   * STAFF/GUEST cases — see `useAffiliateLinkManager.actions.ts`'s matching
   * `@decision`).
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
            t("error.affiliate_payout_destination_form_timeout"),
            responseCodes.Timeout,
            ErrorOrigin.Headless,
            { error, state: state.value }
          )
        )
      );
  }

  async function isReady(): Promise<boolean> {
    return whenSettled();
  }

  async function input(
    model: AffiliatePayoutDestinationFormModel | Record<string, unknown>
  ): Promise<AffiliatePayoutDestinationFormModel> {
    send({ type: "SET", data: model });
    return waitFor(machineService, s =>
      stateMatches(s, ["available.valid", "available.invalid"])
    )
      .then(s => s.context.model as AffiliatePayoutDestinationFormModel)
      .catch(() =>
        Promise.reject(
          new DetailedError(
            t("error.affiliate_payout_destination_not_available"),
            responseCodes.Forbidden,
            ErrorOrigin.Headless
          )
        )
      );
  }

  const debouncedInput = debounce(input, DEBOUNCE_DELAY);

  /**
   * Saves the model. After a successful save, awaits the account-key
   * invalidate the machine's `update`/`add` service already sent, then
   * REFRESHes — re-seeding the model from the saved account (design.md §8.6,
   * D-40). A failed save sends no `REFRESH`; the model keeps the edit.
   */
  async function update(
    value?: AffiliatePayoutDestinationFormModel | Record<string, unknown>
  ): Promise<AffiliatePayoutDestinationFormModel> {
    await debouncedInput.flush()?.catch(() => undefined);

    const model = contextValue<AffiliatePayoutDestinationFormModel>(
      state,
      "model"
    );

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
     * why: design.md D-33 "no action rejects on a server failure" — a 422/5xx
     *      fills `errors` in context (readable via `useContext().errors`) and
     *      the manager returns to `available`; the CALLER reads
     *      `useMeta().hasError`/`hasErrors`, it does not catch a throw (see
     *      `useAffiliateLinkManager.actions.ts`'s matching `@decision`, F-2).
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
      .then(s => {
        const saved = contextValue<AffiliatePayoutDestinationFormModel>(
          s,
          "model"
        );
        if (stateMatches(s, ["available.error", "available.invalid"]))
          return saved as AffiliatePayoutDestinationFormModel;
        const accountId = contextValue<string | undefined>(state, "accountId");
        send({ type: "REFRESH", data: { accountId } });
        return saved as AffiliatePayoutDestinationFormModel;
      })
      .catch(() =>
        Promise.reject(
          new DetailedError(
            t("error.affiliate_payout_destination_form_timeout"),
            responseCodes.Timeout,
            ErrorOrigin.Headless,
            { state: state.value }
          )
        )
      );
  }

  /**
   * Adds an email, re-fetches the client's emails page, replaces `emails`
   * in context and preselects the new email — no `REFRESH` (design.md §8.6).
   */
  async function addEmail(email: IEmail): Promise<void> {
    const { activeUser } = useActiveSession().useContext();
    const clientId = activeUser.value?.id;
    const emails = clientId ? await loadAffiliateClientEmails(clientId) : [];
    const model = contextValue<AffiliatePayoutDestinationFormModel>(
      state,
      "model"
    );
    send({
      type: "SET",
      data: { ...model, paypalEmailId: email.id },
      emails
    });
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
  async function revert(): Promise<AffiliatePayoutDestinationFormModel> {
    const baseModel =
      contextValue<AffiliatePayoutDestinationFormModel>(state, "baseModel") ??
      {};
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
    addEmail,
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

export type UseAffiliatePayoutDestinationManagerActions = ReturnType<
  typeof createAffiliatePayoutDestinationManagerActions
>;
