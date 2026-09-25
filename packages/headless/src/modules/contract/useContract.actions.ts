import { waitFor } from "xstate/lib/waitFor";
import { resetQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope/scope.registry";
import { useI18n } from "../system-localisation";
import { queryKey } from "./contract.services";
import {
  contextValue,
  DEBOUNCE_DELAY,
  DetailedError,
  ErrorOrigin,
  responseCodes,
  stateMatches,
  stopService,
  waitForProcessing
} from "../../utils";
import { debounce, get, isNil } from "lodash-es";
import type {
  Contract,
  ContractWriteModel,
  SetPaymentMethodModel
} from "./contract.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module contract/useContract.actions
 * @description Manager actions — the ONE contract-level write the contract
 * keeps (R34), the payment-method form, and lifecycle. The form is driven the
 * auth way: `openPaymentMethod` opens it, `input` feeds a model (debounced),
 * `clear` closes it, `update` submits it. `setPaymentMethod` is the direct
 * call that opens + updates in one, so every existing caller keeps working
 * and every model is validated by the machine. It never raises feedback: a
 * failure rejects with a `DetailedError` for the CALLER to render, while the
 * machine keeps its own copy on context for `useContract.context.ts`.
 *
 * @doctrine clause 2 (fresh modules start armless).
 */
export function createContractActions(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  scopeKey: string
) {
  const { state, send, service } = actor;
  const { t } = useI18n();

  /**
   * Resolves when the contract has been placed in its node.
   * @returns true once `available` or `unavailable`, false on `error` or if
   *   it never settled.
   */
  async function isReady(): Promise<boolean> {
    return waitForProcessing(service, ["available", "unavailable"], "error");
  }

  /**
   * Resolves once a payment-method write leaves `changingPaymentMethod.processing`,
   * from either parent.
   * @returns true once settled on `available` or `unavailable`; false on
   *   `error`, on `done`, or if it never settled.
   */
  function onDone(): Promise<boolean> {
    const transient = [
      "available.changingPaymentMethod.processing",
      "unavailable.changingPaymentMethod.processing"
    ];

    return waitFor(
      service,
      s =>
        !stateMatches(s, transient) &&
        (stateMatches(s, ["available", "unavailable", "error"]) || s.done),
      { timeout: 60_000 }
    )
      .then(s => !s.done && stateMatches(s, ["available", "unavailable"]))
      .catch(() => false);
  }

  /**
   * Resolves the re-read contract once the payment-method form write settles.
   * @throws {DetailedError} when the model is invalid or the write failed.
   */
  async function resolveFormWrite(failureKey: string): Promise<Contract> {
    const settled = await waitForProcessing(
      service,
      [
        "available.changingPaymentMethod.idle",
        "unavailable.changingPaymentMethod.idle"
      ],
      [
        "available.changingPaymentMethod.available.error",
        "unavailable.changingPaymentMethod.available.error"
      ]
    );

    const error = contextValue<ResponseError>(state, "error");
    const contract = contextValue<Contract>(state, "contract");

    if (!isNil(error) || !settled || isNil(contract)) {
      return Promise.reject(
        new DetailedError(
          t(failureKey),
          error?.status ?? responseCodes.Timeout,
          ErrorOrigin.Headless,
          { error, state: state.value.value }
        )
      );
    }

    return contract;
  }

  /** Opens the payment-method form (AC8) — the machine builds its schema on entry. */
  function openPaymentMethod(): void {
    send({ type: "PAYMENT_METHOD" });
  }

  /**
   * Feeds a model into the open form and resolves the parsed/validated model.
   * Debounced on the way out (see `input` in the return block) — the raw
   * function is kept private so `update` can flush it.
   */
  async function input(
    model: Partial<SetPaymentMethodModel>
  ): Promise<ContractWriteModel> {
    send({ type: "SET.PAYMENT_METHOD", data: model });

    // Waiting on `available` alone would return the PRE-parse model.
    return waitFor(service, s =>
      stateMatches(s, [
        "available.changingPaymentMethod.available.valid",
        "available.changingPaymentMethod.available.invalid",
        "unavailable.changingPaymentMethod.available.valid",
        "unavailable.changingPaymentMethod.available.invalid"
      ])
    )
      .then(s => get(s, "context.paymentMethod.model") as ContractWriteModel)
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

  /** Closes the open form and re-places the node, form cleared. */
  function clear(): void {
    send({ type: "CANCEL.PAYMENT_METHOD" });
  }

  /**
   * Flushes any pending debounced input, feeds `value` when given, then
   * submits the open payment-method form's current model (AC8).
   * @returns the re-read contract, or `false` when nothing was sent — the
   *   form's model names no method or the one the contract already uses, or
   *   the node refused the event.
   */
  async function update(
    value?: Partial<SetPaymentMethodModel>
  ): Promise<Contract | false> {
    await debouncedInput.flush()?.catch(() => undefined);

    if (value) {
      send({ type: "SET.PAYMENT_METHOD", data: value });
    }

    /**
     * @decision The no-op refusal lives here, in the action layer, guarding the
     * submit (R31, moved from `setPaymentMethod` so the form path honours it too).
     * what: no `SET_PAYMENT_METHOD` is sent when the open form's
     *   `paymentMethod.model.paymentDetailsId` is empty or equals
     *   `contract.paymentDetailsId`; the call resolves `false`, the same
     *   channel as a node refusal. Both the form path (`openPaymentMethod` →
     *   `input` → `update`) and `setPaymentMethod` (which opens + updates)
     *   route through here, so both honour it.
     * why: legacy `changePaymentMethodModal.vue:114-117` returns early on
     *   `!isChanged`, and `isChanged` (`:82-89`) is true only when the
     *   selection differs from the contract's `payment_details_id` or
     *   `gateway_id`. Our model names a stored method only, so the id is the
     *   whole comparison. Design 8.3 keeps the locked chart guardless, so the
     *   refusal is the action's, as it is legacy's.
     * rejected: a guard on the locked chart (R4, ADR-17); a distinct return
     *   value for the no-op — the caller's question is "did anything change",
     *   and `false` already answers it.
     */
    const model = contextValue<Partial<SetPaymentMethodModel>>(
      state,
      "paymentMethod.model"
    );
    const current = contextValue<Contract["paymentDetailsId"]>(
      state,
      "contract.paymentDetailsId"
    );
    if (!model?.paymentDetailsId || model.paymentDetailsId === current) {
      return false;
    }

    send({ type: "SET_PAYMENT_METHOD" });

    if (
      !stateMatches(state, "available.changingPaymentMethod.processing") &&
      !stateMatches(state, "unavailable.changingPaymentMethod.processing")
    ) {
      return false;
    }

    return resolveFormWrite("error.contract_set_payment_method_failed");
  }

  /**
   * Sets which stored payment method pays the contract's future invoices
   * (AC8) — opens the form, feeds the model, submits.
   * @returns the re-read contract, or `false` when nothing was sent — the
   *   model names no method or the one already in use, or the node refused
   *   the event.
   */
  async function setPaymentMethod(
    model: SetPaymentMethodModel
  ): Promise<Contract | false> {
    openPaymentMethod();

    return update(model);
  }

  /** Re-reads the contract from the server. */
  function refresh(): void {
    send({ type: "REFRESH" });
  }

  /**
   * Drops the module's cache entries and re-drives the read through `REFRESH`,
   * so the editor asks again rather than restoring stale rows from memory.
   */
  async function reset(): Promise<void> {
    await resetQueryByKey(queryKey)();
    send({ type: "REFRESH", data: {} });
  }

  /** Stops the underlying machine, leaving the registry entry in place. */
  function stop(): void {
    debouncedInput.cancel();
    stopService(service);
  }

  /** Destroys this scoped instance — stops the machine AND removes it from the registry. */
  function destroy(): void {
    debouncedInput.cancel();
    stopService(service);
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
    openPaymentMethod,

    /**
     * @scenario-include
     */
    refresh,

    /**
     * Drops the module's cache entries and re-drives the read.
     * @scenario-include
     */
    reset,

    /**
     * @scenario-include
     */
    setPaymentMethod,

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

export type UseContractActions = ReturnType<typeof createContractActions>;
