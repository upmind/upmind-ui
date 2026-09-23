import { remove as removeFromRegistry } from "../scope/scope.registry";
import { useI18n } from "../system-localisation";
import {
  ContractProductCancelOption,
  ContractProductFormTypes
} from "./contract-product.types";
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
  CancellationModel,
  ContractProduct,
  ContractProductWriteModel,
  RequestCancellationModel,
  ScheduleCancellationModel,
  SetConsolidationModel,
  SoftCancelModel
} from "./contract-product.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProduct.actions
 * @description Manager actions — every cancellation write (R33) plus the
 * consolidation write, driven the auth way: `openCancellation` /
 * `openConsolidation` open a form, `set` feeds a model, `cancelForm` closes it,
 * `submitCancellation` / `submitConsolidation` send the write (the cancellation
 * submit routes off `model.option`). The legacy direct calls — `stopRenewing`,
 * `resumeRenewing`, `scheduleCancellation`, `requestCancellation`,
 * `setConsolidation` — open + set + submit in one, so every existing caller
 * keeps working and every model is validated by the machine. `withdrawCancellation`
 * and `revokeScheduledCancellation` are formless. Nothing here raises feedback —
 * a failure rejects with a `DetailedError` for the CALLER to render.
 *
 * @doctrine clause 2 (fresh modules start armless).
 */

/** The submit event each cancellation option routes to (routing lives here, R33). */
const CANCEL_OPTION_EVENT: Record<ContractProductCancelOption, string> = {
  [ContractProductCancelOption.SOFT]: "STOP_RENEWING",
  [ContractProductCancelOption.SCHEDULE_FUTURE]: "SCHEDULE_CANCEL",
  [ContractProductCancelOption.HARD]: "REQUEST_CANCEL"
};

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

  /**
   * Resolves the re-read product once a form write has settled.
   * @throws {DetailedError} when the model is invalid or the write failed.
   */
  async function resolveFormWrite(
    region: string,
    message: string
  ): Promise<ContractProduct> {
    const settled = await waitForProcessing(
      service,
      [`available.${region}.idle`, "unavailable"],
      [`available.${region}.available.error`]
    );
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

  /** Opens the combined cancellation form — the machine builds its schema on entry. */
  function openCancellation(): void {
    send({ type: "CANCELLATION" });
  }

  /** Opens the consolidation form — the machine builds its schema on entry. */
  function openConsolidation(): void {
    send({ type: "CONSOLIDATION" });
  }

  /** Feeds a model into an open form; the machine parses and validates it. */
  function set(
    form: ContractProductFormTypes,
    model: Partial<ContractProductWriteModel>
  ): void {
    send({ type: `SET.${form}`, data: model });
  }

  /** Closes an open form, its model cleared. */
  function cancelForm(form: ContractProductFormTypes): void {
    send({ type: `CANCEL.${form}` });
  }

  /**
   * Submits the open cancellation form, routed off `model.option`.
   * @returns the re-read product, or `false` when the option is unknown or the
   *   node refused the routed event.
   */
  async function submitCancellation(): Promise<ContractProduct | false> {
    const model = contextValue<CancellationModel>(state, "cancellation.model");
    const type = model?.option && CANCEL_OPTION_EVENT[model.option];
    if (!type) return false;

    send({ type });
    if (!stateMatches(state, "available.cancelling.processing")) return false;

    return resolveFormWrite(
      "cancelling",
      t("error.contract_product_cancel_failed")
    );
  }

  /**
   * Submits the open consolidation form.
   * @returns the re-read product, or `false` when the node refused the event.
   */
  async function submitConsolidation(): Promise<ContractProduct | false> {
    send({ type: "SET_CONSOLIDATION" });
    if (!stateMatches(state, "available.consolidating.processing")) {
      return false;
    }

    return resolveFormWrite(
      "consolidating",
      t("error.contract_product_set_consolidation_failed")
    );
  }

  async function stopRenewing(
    model?: Omit<SoftCancelModel, "renew">
  ): Promise<ContractProduct | false> {
    openCancellation();
    set(ContractProductFormTypes.CANCELLATION, {
      option: ContractProductCancelOption.SOFT,
      ...(model ?? {})
    });

    return submitCancellation();
  }

  async function resumeRenewing(): Promise<ContractProduct | false> {
    send({ type: "RESUME" });
    if (!stateMatches(state, "processing")) return false;

    return resolveContractProduct(t("error.contract_product_cancel_failed"));
  }

  async function scheduleCancellation(
    model: ScheduleCancellationModel
  ): Promise<ContractProduct | false> {
    openCancellation();
    set(ContractProductFormTypes.CANCELLATION, {
      option: ContractProductCancelOption.SCHEDULE_FUTURE,
      ...model
    });

    return submitCancellation();
  }

  async function requestCancellation(
    model?: Omit<RequestCancellationModel, "productIds">
  ): Promise<ContractProduct | false> {
    openCancellation();
    set(ContractProductFormTypes.CANCELLATION, {
      option: ContractProductCancelOption.HARD,
      ...(model ?? {})
    });

    return submitCancellation();
  }

  async function setConsolidation(
    model: SetConsolidationModel
  ): Promise<ContractProduct | false> {
    openConsolidation();
    set(ContractProductFormTypes.CONSOLIDATION, model);

    return submitConsolidation();
  }

  async function withdrawCancellation(): Promise<ContractProduct | false> {
    send({ type: "WITHDRAW" });
    if (!stateMatches(state, "processing")) return false;

    return resolveContractProduct(
      t("error.contract_product_withdraw_cancellation_failed")
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
     * Closes the open form and re-places the node, form cleared.
     * @scenario-include
     */
    cancelForm,

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
     * Opens the combined cancellation form (R33).
     * @scenario-include
     */
    openCancellation,

    /**
     * Opens the consolidation form.
     * @scenario-include
     */
    openConsolidation,

    /**
     * Re-reads the product.
     * @scenario-include
     */
    refresh,

    /**
     * Requests immediate cancellation of this product (HARD, R33).
     * @scenario-include
     */
    requestCancellation,

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
     * Feeds a model into the open form.
     * @scenario-include
     */
    set,

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
    stopRenewing,

    /**
     * Submits the open cancellation form, routed off `model.option`.
     * @scenario-include
     */
    submitCancellation,

    /**
     * Submits the open consolidation form.
     * @scenario-include
     */
    submitConsolidation,

    /**
     * Withdraws this product's pending cancellation request (R33).
     * @scenario-include
     */
    withdrawCancellation
  };
}

export type UseContractProductActions = ReturnType<
  typeof createContractProductActions
>;
