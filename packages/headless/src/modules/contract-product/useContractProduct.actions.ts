import { waitFor } from "xstate/lib/waitFor";
import { resetQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope/scope.registry";
import { useI18n } from "../system-localisation";
import { queryKey } from "./contract-product.services";
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
import { find, isNil } from "lodash-es";
import type {
  CancellationModel,
  ContractProduct,
  ContractProductWriteModel,
  MigrationHolders,
  MigrationResult,
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
  scopeKey: string,
  holders: MigrationHolders
) {
  const { state, send, service } = actor;
  const { t } = useI18n();

  /**
   * Resolves once the product is placed on a node.
   * @returns true once `available` or `unavailable`; false on `error`, or if the
   *   read never settled.
   */
  function isReady(): Promise<boolean> {
    return waitForProcessing(service, ["available", "unavailable"], "error");
  }

  /**
   * Resolves once a write leaves `processing` or `available.<region>.processing`
   * (region: `cancelling` | `consolidating`).
   * @returns true once the write settles on `available` or `unavailable`; false
   *   on `error`, on `done`, or if it never settled.
   */
  function onDone(): Promise<boolean> {
    const transient = [
      "processing",
      "available.cancelling.processing",
      "available.consolidating.processing",
      "available.migrating.configuring.processing"
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
   * Resolves the re-read product once a write has settled.
   * @throws {DetailedError} when the write or the re-read recorded an error.
   */
  async function resolveContractProduct(
    message: string
  ): Promise<ContractProduct> {
    const settled = await waitForProcessing(
      service,
      ["available", "unavailable"],
      "error"
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
      [`available.${region}.available.error`, "error"]
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
   * Submits the open consolidation form. As legacy's `formIsChanged` gate
   * (`cProdInvoiceConsolidationForm.vue:58-61`), a choice equal to the
   * product's current value is not sent and the form stays open.
   * @returns the re-read product, or `false` when there is no changed choice
   *   or the node refused the event.
   */
  async function submitConsolidation(): Promise<ContractProduct | false> {
    const model = contextValue<SetConsolidationModel>(
      state,
      "consolidation.model"
    );
    if (isNil(model?.invoiceConsolidationEnabled)) return false;
    if (
      model.invoiceConsolidationEnabled ===
      contextValue<number>(
        state,
        "rawContractProduct.invoice_consolidation_enabled"
      )
    ) {
      return false;
    }

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

  /**
   * Opens the change of product: the product list starts to load.
   * @returns true once the list is open; false when the product cannot change product.
   */
  function openMigration(): boolean {
    send({ type: "MIGRATION" });
    return stateMatches(state, "available.migrating.choosing");
  }

  /**
   * Chooses one product of the loaded list; its configurator starts to load.
   * @returns false, with nothing sent, when the loaded list holds no product of that id.
   */
  async function selectMigrationTarget(id: string): Promise<boolean> {
    const row = find(holders.list.value?.data.value, ["id", id]);
    if (!row) return false;

    send({ type: "MIGRATION.SELECT", data: { id, product: row } });
    return stateMatches(state, "available.migrating.configuring");
  }

  /** Loads the next page of the product list. */
  async function loadMoreMigrationTargets(): Promise<void> {
    await holders.list.value?.nextPage();
  }

  /** Loads the chosen product again, from the start, after it failed to load. */
  function reloadMigrationTarget(): void {
    send({ type: "MIGRATION.RELOAD" });
  }

  /** Closes the change of product. The chosen product's configurator stops. */
  function cancelMigration(): void {
    send({ type: "CANCEL.MIGRATION" });
  }

  /**
   * Commits the change of product. The platform judges the commit, not the local
   * validation.
   * @returns the invoice the change raised, or `false` when the commit is not
   *   offered now: no dry run or refused state, or the configurator is not ready.
   * @throws {DetailedError} when the platform refuses the change.
   */
  async function migrate(): Promise<MigrationResult | false> {
    if (!holders.isMigrationTargetReady.value) return false;

    send({ type: "MIGRATE" });
    if (!stateMatches(state, "available.migrating.configuring.processing"))
      return false;

    await waitForProcessing(
      service,
      ["available.migrating.idle", "unavailable"],
      ["available.migrating.configuring.error", "error"]
    );
    const error = contextValue<ResponseError>(state, "error");
    const result = contextValue<MigrationResult>(state, "migrationResult");

    if (!result) {
      throw new DetailedError(
        t("error.contract_product_migrate_failed"),
        error?.status ?? responseCodes.Timeout,
        ErrorOrigin.Headless,
        { error, state: state.value.value }
      );
    }

    return result;
  }

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

  function stop(): void {
    holders.dispose();
    stopService(service);
  }

  function destroy(): void {
    holders.dispose();
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
     * Closes the change of product.
     * @scenario-include
     */
    cancelMigration,

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
     * Loads the next page of the product list.
     * @scenario-include
     */
    loadMoreMigrationTargets,

    /**
     * Commits the change of product and resolves the invoice it raised.
     * @scenario-include
     */
    migrate,

    /**
     * Resolves once a write leaves `processing`, settled on `available` or
     * `unavailable`; false on `error`.
     * @scenario-include
     */
    onDone,

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
     * Opens the change of product.
     * @scenario-include
     */
    openMigration,

    /**
     * Re-reads the product.
     * @scenario-include
     */
    refresh,

    /**
     * Loads the chosen product again after it failed to load.
     * @scenario-include
     */
    reloadMigrationTarget,

    /**
     * Requests immediate cancellation of this product (HARD, R33).
     * @scenario-include
     */
    requestCancellation,

    /**
     * Drops the module's cache entries and re-drives the read.
     * @scenario-include
     */
    reset,

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
     * Chooses one product of the loaded list.
     * @scenario-include
     */
    selectMigrationTarget,

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
