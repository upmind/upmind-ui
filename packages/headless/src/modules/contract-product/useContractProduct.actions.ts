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
import type {
  ContractProduct,
  ScheduleCancellationModel,
  SetConsolidationModel,
  SoftCancelModel
} from "./contract-product.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProduct.actions
 * @description Manager actions — the five writes of design 8.3 (the renewal
 * stop and its abort, the consolidation value, the two scheduled-cancellation
 * writes of R18) and lifecycle. Each write sends its event, waits for the
 * machine to settle back on a node, and resolves the re-read product; a
 * refused event (no transition entered `processing`) resolves `false`.
 * Nothing here raises feedback — a failure rejects for the CALLER to render.
 *
 * @doctrine clause 2 (fresh modules start armless).
 */
export function createContractProductActions(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  scopeKey: string
) {
  const { state, send, service } = actor;
  const { t } = useI18n();

  /**
   * Resolves once the product is placed on a node.
   * @returns true once `available` or `unavailable`; false if the read never settled.
   */
  function isReady(): Promise<boolean> {
    return waitForProcessing(service, ["available", "unavailable"]);
  }

  /**
   * Resolves the re-read product once a write has settled.
   * @throws {DetailedError} when the write or the re-read recorded an error.
   */
  async function resolveContractProduct(
    message: string
  ): Promise<ContractProduct> {
    const settled = await waitForProcessing(service, [
      "available",
      "unavailable"
    ]);
    const error = contextValue<ResponseError>(state, "error");
    const contractProduct = contextValue<ContractProduct>(
      state,
      "contractProduct"
    );

    if (error || !settled || !contractProduct) {
      throw new DetailedError(
        message,
        error?.status ?? responseCodes.Timeout,
        ErrorOrigin.Headless,
        { error, state: state.value.value }
      );
    }

    return contractProduct;
  }

  async function stopRenewing(
    model?: Omit<SoftCancelModel, "renew">
  ): Promise<ContractProduct | false> {
    send({ type: "STOP_RENEWING", data: model });
    if (!stateMatches(state, "processing")) return false;

    return resolveContractProduct(
      t("error.contract_product_stop_renewing_failed")
    );
  }

  async function resumeRenewing(): Promise<ContractProduct | false> {
    send({ type: "RESUME" });
    if (!stateMatches(state, "processing")) return false;

    return resolveContractProduct(
      t("error.contract_product_resume_renewing_failed")
    );
  }

  async function setConsolidation(
    model: SetConsolidationModel
  ): Promise<ContractProduct | false> {
    send({ type: "SET_CONSOLIDATION", data: model });
    if (!stateMatches(state, "processing")) return false;

    return resolveContractProduct(
      t("error.contract_product_set_consolidation_failed")
    );
  }

  async function scheduleCancellation(
    model: ScheduleCancellationModel
  ): Promise<ContractProduct | false> {
    send({ type: "SCHEDULE_CANCEL", data: model });
    if (!stateMatches(state, "processing")) return false;

    return resolveContractProduct(
      t("error.contract_product_schedule_cancellation_failed")
    );
  }

  async function revokeScheduledCancellation(): Promise<
    ContractProduct | false
  > {
    send({ type: "SCHEDULE_CANCEL_REVOKE" });
    if (!stateMatches(state, "processing")) return false;

    return resolveContractProduct(
      t("error.contract_product_revoke_scheduled_cancellation_failed")
    );
  }

  function refresh(): void {
    send({ type: "REFRESH" });
  }

  function stop(): void {
    stopService(service);
  }

  function destroy(): void {
    stopService(service);
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned (clause 2, design 8.8).

  return {
    /**
     * Destroys this scoped instance — stops the machine and deregisters it.
     * @scenario-include
     */
    destroy,

    /**
     * Resolves once the product is placed on a node.
     * @scenario-include
     */
    isReady,

    /**
     * Re-reads the product.
     * @scenario-include
     */
    refresh,

    /**
     * Aborts a pending renewal stop (`PUT …/modify_renew`, `renew: true`).
     * @scenario-include
     */
    resumeRenewing,

    /**
     * Revokes a scheduled cancellation (R18).
     * @scenario-include
     */
    revokeScheduledCancellation,

    /**
     * Books a cancellation for a chosen date (R18).
     * @scenario-include
     */
    scheduleCancellation,

    /**
     * Sets the invoice consolidation value; a subscription only.
     * @scenario-include
     */
    setConsolidation,

    /**
     * Stops the underlying machine, leaving the registry entry in place.
     * @scenario-include
     */
    stop,

    /**
     * Stops the renewal (`PUT …/modify_renew`, `renew: false`); a subscription only.
     * @scenario-include
     */
    stopRenewing
  };
}

export type UseContractProductActions = ReturnType<
  typeof createContractProductActions
>;
