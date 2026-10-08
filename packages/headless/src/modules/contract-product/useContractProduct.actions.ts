import { resetQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope/scope.registry";
import { useI18n } from "../system-localisation";
import {
  CANCEL_OPTION_EVENT,
  ContractProductCancelOption,
  ContractProductFormTypes,
  ContractProductRegionLoadingStates,
  ContractProductRegionWriteStates
} from "./contract-product.types";
import { hasRegionWrite } from "./contract-product.utils";
import { queryKey } from "./contract-products.services";
import {
  contextValue,
  DetailedError,
  ErrorOrigin,
  responseCodes,
  stateMatches,
  stopService,
  waitForProcessing
} from "../../utils";
import { find, isNil, isString, values } from "lodash-es";
import type {
  BillingEntityChoice,
  BillingEntityModel,
  CancellationModel,
  ContractProduct,
  ContractProductActionMembers,
  ContractProductWriteModel,
  MigrationHolders,
  MigrationResult,
  RequestCancellationModel,
  ScheduleCancellationModel,
  SetConsolidationModel,
  SoftCancelModel
} from "./contract-product.types";
import type { ResponseError, UseActor } from "../../utils";
import type { Invoice } from "../invoices";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProduct.actions
 * @description Manager actions. The form writes are driven the auth way: an
 * `open*` member opens a form, `set` feeds a model, `cancelForm` closes it and
 * a `submit*` member sends the write (the cancellation submit routes off
 * `model.option`). The direct calls (`stopRenewing`, `scheduleCancellation`,
 * `requestCancellation`, `setConsolidation`, `setBillingEntity`) open, set and
 * submit in one, so every model is validated by the machine. The other writes
 * are formless. Nothing here raises feedback: a failure rejects with a
 * `DetailedError` for the caller to render.
 */

/** The error a settled write throws: the status of the recorded error, else a timeout. */
function failure(actor: UseActor, message: string): DetailedError {
  const error = contextValue<ResponseError>(actor.state, "error");

  return new DetailedError(
    message,
    error?.status ?? responseCodes.Timeout,
    ErrorOrigin.Headless,
    { error, state: actor.state.value.value }
  );
}

/**
 * Sends one formless write and resolves the re-read product.
 * @returns `false`, with nothing sent, when the machine refuses the event or
 *   another write is already in flight.
 * @throws {DetailedError} when the write or the re-read recorded an error.
 */
async function writeProduct(
  actor: UseActor,
  event: AnyEventObject,
  message: string
): Promise<ContractProduct | false> {
  if (
    stateMatches(actor.state, "processing") ||
    hasRegionWrite(actor.state.value)
  ) {
    return false;
  }

  actor.send(event);
  if (!stateMatches(actor.state, "processing")) return false;

  const settled = await waitForProcessing(
    actor.service,
    ["available", "unavailable"],
    "error"
  );
  const contractProduct = contextValue<ContractProduct>(
    actor.state,
    "contractProduct"
  );
  if (contextValue(actor.state, "error") || !settled || !contractProduct) {
    throw failure(actor, message);
  }

  return contractProduct;
}

/**
 * Resolves the re-read product once a form write has settled.
 * @throws {DetailedError} when the model is invalid or the write failed.
 */
async function resolveFormWrite(
  actor: UseActor,
  message: string
): Promise<ContractProduct> {
  const settled = await waitForProcessing(
    actor.service,
    ["available", "unavailable"],
    "error",
    values(ContractProductRegionWriteStates)
  );
  const contractProduct = contextValue<ContractProduct>(
    actor.state,
    "contractProduct"
  );

  if (contextValue(actor.state, "error") || !settled || !contractProduct) {
    throw failure(actor, message);
  }

  return contractProduct;
}

/**
 * Opens a form region on the placed node that holds it, and resolves once the
 * form takes a model.
 * @returns `false` at once when no placed node holds the region, and `false`
 *   when the region refuses to open.
 */
async function openForm(
  actor: UseActor,
  form: ContractProductFormTypes,
  region: string
): Promise<boolean> {
  const node = find(["available", "unavailable"], placed =>
    stateMatches(actor.state, `${placed}.${region}`)
  );
  if (!node) return false;

  actor.send({ type: form });
  return waitForProcessing(actor.service, `${node}.${region}.available`, [
    `${node}.${region}.idle`,
    "error"
  ]);
}

export function createContractProductActions(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  scopeKey: string,
  holders: MigrationHolders
): ContractProductActionMembers {
  const { t } = useI18n();
  const { state, send, service } = actor;

  /** Resolves once the product is placed on a node. */
  async function isReady(): Promise<boolean> {
    return waitForProcessing(service, ["available", "unavailable"], "error");
  }

  /**
   * Resolves once no write is in flight and the product is placed again.
   * @returns `true` on a placed node, `false` on `error`.
   */
  async function onDone(): Promise<boolean> {
    return waitForProcessing(service, ["available", "unavailable"], "error", [
      "processing",
      ...values(ContractProductRegionLoadingStates),
      ...values(ContractProductRegionWriteStates)
    ]);
  }

  /** Stops the underlying machine, leaving the registry entry in place. */
  function stop(): void {
    holders.dispose();
    stopService(service);
  }

  /** Destroys this scoped instance — stops the machine and deregisters it. */
  function destroy(): void {
    stop();
    removeFromRegistry(scopeKey);
  }

  /** Re-reads the product. */
  function refresh(): void {
    send({ type: "REFRESH" });
  }

  /** Drops the module's cache entries and re-drives the read. */
  async function reset(): Promise<void> {
    await resetQueryByKey(queryKey)();
    send({ type: "REFRESH" });
  }

  /** Opens the combined cancellation form. */
  function openCancellation(): void {
    send({ type: ContractProductFormTypes.CANCELLATION });
  }

  /** Opens the consolidation form. */
  function openConsolidation(): void {
    send({ type: ContractProductFormTypes.CONSOLIDATION });
  }

  /** Opens the billing-entity form once the client's addresses and companies are read. */
  function openBillingEntity(): void {
    send({ type: ContractProductFormTypes.BILLING_ENTITY });
  }

  /** Feeds a model into the open form. */
  function set(
    form: ContractProductFormTypes,
    model: Partial<ContractProductWriteModel>
  ): void {
    send({ type: `SET.${form}`, data: model });
  }

  /** Closes the open form, cleared. */
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
    if (!stateMatches(state, ContractProductRegionWriteStates.CANCELLING)) {
      return false;
    }

    return resolveFormWrite(actor, t("error.contract_product_cancel_failed"));
  }

  /**
   * Opens the cancellation form, feeds it the chosen option and its model, and
   * submits it.
   * @returns `false` when the form does not open.
   */
  async function cancelWith(
    model: Partial<CancellationModel>
  ): Promise<ContractProduct | false> {
    if (
      !(await openForm(
        actor,
        ContractProductFormTypes.CANCELLATION,
        "cancelling"
      ))
    ) {
      return false;
    }

    send({ type: `SET.${ContractProductFormTypes.CANCELLATION}`, data: model });

    return submitCancellation();
  }

  /**
   * Submits the open consolidation form. A choice equal to the product's
   * current value sends nothing, closes the form and resolves the current
   * product.
   */
  async function submitConsolidation(): Promise<ContractProduct | false> {
    const model = contextValue<SetConsolidationModel>(
      state,
      "consolidation.model"
    );
    const product = contextValue<ContractProduct>(state, "contractProduct");
    if (isNil(model?.invoiceConsolidationEnabled)) return false;
    if (
      product &&
      model.invoiceConsolidationEnabled === product.invoiceConsolidationEnabled
    ) {
      send({ type: `CANCEL.${ContractProductFormTypes.CONSOLIDATION}` });
      return product;
    }

    send({ type: "SET_CONSOLIDATION" });
    if (!stateMatches(state, ContractProductRegionWriteStates.CONSOLIDATING)) {
      return false;
    }

    return resolveFormWrite(
      actor,
      t("error.contract_product_set_consolidation_failed")
    );
  }

  /** Sets the invoice consolidation value: opens the form, feeds it and submits it. */
  async function setConsolidation(
    model: SetConsolidationModel
  ): Promise<ContractProduct | false> {
    if (
      !(await openForm(
        actor,
        ContractProductFormTypes.CONSOLIDATION,
        "consolidating"
      ))
    ) {
      return false;
    }

    send({
      type: `SET.${ContractProductFormTypes.CONSOLIDATION}`,
      data: model
    });

    return submitConsolidation();
  }

  /**
   * Submits the open billing-entity form. A pick of what the contract bills to
   * now sends nothing, closes the form and resolves the current product.
   */
  async function submitBillingEntity(): Promise<ContractProduct | false> {
    const picked = contextValue<BillingEntityModel["billing_entity"]>(
      state,
      "billingEntity.model.billing_entity"
    );
    const product = contextValue<ContractProduct>(state, "contractProduct");
    if (isNil(picked)) return false;
    if (
      product &&
      picked === (product.billingCompanyId ?? product.billingAddressId)
    ) {
      send({ type: `CANCEL.${ContractProductFormTypes.BILLING_ENTITY}` });
      return product;
    }

    send({ type: "SET_BILLING_ENTITY" });
    if (
      !stateMatches(state, [
        ContractProductRegionWriteStates.BILLING_ENTITY,
        ContractProductRegionWriteStates.BILLING_ENTITY_UNAVAILABLE
      ])
    ) {
      return false;
    }

    return resolveFormWrite(
      actor,
      t("error.contract_product_billing_entity_failed")
    );
  }

  /**
   * Changes the billing entity to one picked address or company, by its id or
   * the entity in hand: opens the form, waits for its lists, feeds it the id
   * and submits it.
   */
  async function setBillingEntity(
    pick: BillingEntityChoice | string
  ): Promise<ContractProduct | false> {
    if (
      !(await openForm(
        actor,
        ContractProductFormTypes.BILLING_ENTITY,
        "billingEntity"
      ))
    ) {
      return false;
    }

    let id: string;
    if (isString(pick)) id = pick;
    else id = "company" in pick ? pick.company.id : pick.address.id;
    send({
      type: `SET.${ContractProductFormTypes.BILLING_ENTITY}`,
      data: { billing_entity: id }
    });

    return submitBillingEntity();
  }

  /** Stops the renewal (`PUT …/modify_renew`, `renew: false`); a subscription only. */
  function stopRenewing(
    model?: Omit<SoftCancelModel, "renew">
  ): Promise<ContractProduct | false> {
    return cancelWith({
      option: ContractProductCancelOption.SOFT,
      ...model
    });
  }

  /** Books a cancellation for a chosen date. */
  function scheduleCancellation(
    model: ScheduleCancellationModel
  ): Promise<ContractProduct | false> {
    return cancelWith({
      option: ContractProductCancelOption.SCHEDULE_FUTURE,
      ...model
    });
  }

  /** Requests immediate cancellation of this product (HARD). */
  function requestCancellation(
    model?: Omit<RequestCancellationModel, "productIds">
  ): Promise<ContractProduct | false> {
    return cancelWith({
      option: ContractProductCancelOption.HARD,
      ...model
    });
  }

  /** Aborts a pending renewal stop (`PUT …/modify_renew`, `renew: true`). */
  function resumeRenewing(): Promise<ContractProduct | false> {
    return writeProduct(
      actor,
      { type: "RESUME" },
      t("error.contract_product_cancel_failed")
    );
  }

  /** Withdraws this product's pending cancellation request. */
  function withdrawCancellation(): Promise<ContractProduct | false> {
    return writeProduct(
      actor,
      { type: "WITHDRAW" },
      t("error.contract_product_withdraw_cancellation_failed")
    );
  }

  /** Revokes a scheduled cancellation. */
  function revokeScheduledCancellation(): Promise<ContractProduct | false> {
    return writeProduct(
      actor,
      { type: "SCHEDULE_CANCEL_REVOKE" },
      t("error.contract_product_revoke_scheduled_cancellation_failed")
    );
  }

  /** Turns renewal invoicing on or off (`PUT …/stop_start_invoicing`). */
  function setAutoRenew(on: boolean): Promise<ContractProduct | false> {
    return writeProduct(
      actor,
      { type: "AUTO_RENEW.SET", data: { on } },
      t("error.contract_product_auto_renew_failed")
    );
  }

  /** Sets the client label of the product; an empty string clears it. */
  function setClientLabel(label: string): Promise<ContractProduct | false> {
    return writeProduct(
      actor,
      { type: "LABEL.SET", data: { label } },
      t("error.contract_product_label_failed")
    );
  }

  /**
   * Ends the trial early and resolves the invoice it raised, or `null` when it
   * raised none. A failed re-read does not hide an invoice already raised.
   */
  async function endTrial(): Promise<Invoice | null | false> {
    if (stateMatches(state, "processing")) return false;
    send({ type: "TRIAL.END" });
    if (!stateMatches(state, "processing")) return false;

    await waitForProcessing(service, ["available", "unavailable"], "error");
    const issuedInvoice = contextValue<Invoice | null>(state, "issuedInvoice");
    if (issuedInvoice === undefined) {
      throw failure(actor, t("error.contract_product_end_trial_failed"));
    }

    return issuedInvoice;
  }

  /**
   * Raises the next invoice now and resolves it. A failed re-read does not
   * hide an invoice already raised.
   * @throws {DetailedError} when the write failed or raised no invoice.
   */
  async function issueNextInvoice(): Promise<Invoice | false> {
    const message = t("error.contract_product_next_invoice_failed");
    if (stateMatches(state, "processing")) return false;
    send({ type: "NEXT_INVOICE.ISSUE" });
    if (!stateMatches(state, "processing")) return false;

    await waitForProcessing(service, ["available", "unavailable"], "error");
    const issuedInvoice = contextValue<Invoice | null>(state, "issuedInvoice");
    if (issuedInvoice === undefined) throw failure(actor, message);
    if (issuedInvoice === null) {
      throw new DetailedError(
        message,
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        { state: state.value.value }
      );
    }

    return issuedInvoice;
  }

  /** Opens the migration; true once the product list is open. */
  function openMigration(): boolean {
    send({ type: "MIGRATION" });
    return stateMatches(state, "available.migrating.choosing");
  }

  /** Loads the next page of the product list. */
  async function loadMoreMigrationTargets(): Promise<void> {
    await holders.list.value?.nextPage();
  }

  /** Loads the chosen product again after it failed to load. */
  function reloadMigrationTarget(): void {
    send({ type: "MIGRATION.RELOAD" });
  }

  /** Closes the migration. */
  function cancelMigration(): void {
    send({ type: "CANCEL.MIGRATION" });
  }

  /** Chooses one product of the loaded list; false, with nothing sent, when the list holds no product of that id. */
  async function selectMigrationTarget(id: string): Promise<boolean> {
    const row = find(holders.list.value?.data.value, ["id", id]);
    if (!row) return false;

    send({ type: "MIGRATION.SELECT", data: { id, product: row } });
    return stateMatches(state, "available.migrating.configuring");
  }

  /**
   * Commits the migration and resolves the invoice it raised, or `false` when
   * the commit is not offered now. The platform judges the commit, not the
   * local validation.
   * @throws {DetailedError} when the platform refuses the change.
   */
  async function migrate(): Promise<MigrationResult | false> {
    send({ type: "MIGRATE" });
    if (!stateMatches(state, "available.migrating.configuring.processing"))
      return false;

    await waitForProcessing(
      service,
      ["available.migrating.idle", "unavailable"],
      ["available.migrating.configuring.error", "error"]
    );
    const result = contextValue<MigrationResult>(state, "migrationResult");
    if (!result)
      throw failure(actor, t("error.contract_product_migrate_failed"));

    return result;
  }

  return {
    /** @scenario-include */
    cancelForm,
    /** @scenario-include */
    cancelMigration,
    /** @scenario-include */
    destroy,
    /** @scenario-include */
    endTrial,
    /** @scenario-include */
    isReady,
    /** @scenario-include */
    issueNextInvoice,
    /** @scenario-include */
    loadMoreMigrationTargets,
    /** @scenario-include */
    migrate,
    /** @scenario-include */
    onDone,
    /** @scenario-include */
    openBillingEntity,
    /** @scenario-include */
    openCancellation,
    /** @scenario-include */
    openConsolidation,
    /** @scenario-include */
    openMigration,
    /** @scenario-include */
    refresh,
    /** @scenario-include */
    reloadMigrationTarget,
    /** @scenario-include */
    requestCancellation,
    /** @scenario-include */
    reset,
    /** @scenario-include */
    resumeRenewing,
    /** @scenario-include */
    revokeScheduledCancellation,
    /** @scenario-include */
    scheduleCancellation,
    /** @scenario-include */
    selectMigrationTarget,
    /** @scenario-include */
    set,
    /** @scenario-include */
    setAutoRenew,
    /** @scenario-include */
    setBillingEntity,
    /** @scenario-include */
    setClientLabel,
    /** @scenario-include */
    setConsolidation,
    /** @scenario-include */
    stop,
    /** @scenario-include */
    stopRenewing,
    /** @scenario-include */
    submitBillingEntity,
    /** @scenario-include */
    submitCancellation,
    /** @scenario-include */
    submitConsolidation,
    /** @scenario-include */
    withdrawCancellation
  };
}

export type UseContractProductActions = ReturnType<
  typeof createContractProductActions
>;
