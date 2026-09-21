import { remove as removeFromRegistry } from "../scope/scope.registry";
import { useI18n } from "../system-localisation";
import {
  contextValue,
  DetailedError,
  ErrorOrigin,
  responseCodes,
  stateMatches,
  stopService,
  waitForProcessing
} from "../../utils";
import { isNil } from "lodash-es";
import type {
  Contract,
  RequestCancellationModel,
  SetPaymentMethodModel
} from "./contract.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module contract/useContract.actions
 * @description Manager actions — the three contract-level writes (design 8.3)
 * and lifecycle. Each write sends its event, and a node that carries no such
 * transition refuses it (`false`, no request). It never raises feedback: a
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
   * @returns true once `available` or `unavailable`, false if it never settled.
   */
  async function isReady(): Promise<boolean> {
    return waitForProcessing(service, ["available", "unavailable"]);
  }

  async function settled(failureKey: string): Promise<Contract | false> {
    if (!stateMatches(service, "processing")) return false;

    await waitForProcessing(service, ["available", "unavailable"]);

    const error = contextValue<ResponseError>(state, "error");
    if (!isNil(error)) {
      return Promise.reject(
        new DetailedError(
          t(failureKey),
          error.status ?? responseCodes.Timeout,
          ErrorOrigin.Headless,
          { error, state: state.value.value }
        )
      );
    }

    return contextValue<Contract>(state, "contract") as Contract;
  }

  /**
   * Requests the cancellation of the named products (AC6).
   * @returns the re-read contract, or `false` when the node refused the event.
   */
  async function requestCancellation(
    model: RequestCancellationModel
  ): Promise<Contract | false> {
    send({ type: "REQUEST_CANCEL", data: model });

    return settled("error.contract_request_cancellation_failed");
  }

  /**
   * Withdraws the pending cancellation request (AC7).
   * @returns the re-read contract, or `false` when the node refused the event.
   */
  async function withdrawCancellation(): Promise<Contract | false> {
    send({ type: "WITHDRAW" });

    return settled("error.contract_withdraw_cancellation_failed");
  }

  /**
   * Sets which stored payment method pays the contract's future invoices (AC8).
   * @returns the re-read contract, or `false` when the node refused the event.
   */
  async function setPaymentMethod(
    model: SetPaymentMethodModel
  ): Promise<Contract | false> {
    send({ type: "SET_PAYMENT_METHOD", data: model });

    return settled("error.contract_set_payment_method_failed");
  }

  /** Re-reads the contract from the server. */
  function refresh(): void {
    send({ type: "REFRESH" });
  }

  /** Stops the underlying machine, leaving the registry entry in place. */
  function stop(): void {
    stopService(service);
  }

  /** Destroys this scoped instance — stops the machine AND removes it from the registry. */
  function destroy(): void {
    stopService(service);
    removeFromRegistry(scopeKey);
  }

  return {
    /**
     * @scenario-include
     */
    destroy,

    /**
     * @scenario-include
     */
    isReady,

    /**
     * @scenario-include
     */
    refresh,

    /**
     * @scenario-include
     */
    requestCancellation,

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
    withdrawCancellation
  };
}

export type UseContractActions = ReturnType<typeof createContractActions>;
