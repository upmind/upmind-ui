/** @internal */
import { effectScope } from "vue";
import { useClientAddresses } from "../client-address";
import { useClientCompanies } from "../client-company";
import {
  ClientCustomFieldsContextTypes,
  useClientCustomFields
} from "../client-custom-fields";
import { invalidateQueryByKey, useQuery } from "../query";
import { ScopeActorTypes } from "../scope/scope.types";
import {
  mapContractProduct,
  toBillingEntityBody,
  toChangeProductBody,
  toChangeProductInput,
  toRequestCancellationBody,
  toScheduleCancellationBody,
  toSoftCancelBody
} from "./contract-product.mappers";
import { useClientLabelSchema } from "./contract-product.schemas";
import { notAvailableError, validateForm } from "./contract-product.utils";
import { queryKey } from "./contract-products.services";
import { contextValue, stateMatches } from "../../utils";
import { find, isNil, isObject, join } from "lodash-es";
import type {
  BillingEntityLists,
  ChangeProductInput,
  ContractProduct,
  ContractProductIds,
  ContractProductMachineServices,
  ClientLabelModel,
  ContractProductServices
} from "./contract-product.types";
import type { CustomField } from "../client-custom-fields";
import type { QueryResponse } from "../query";
import type { ScopeContext } from "../scope/scope.types";
import type { IContractProduct, IInvoice } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/contract-product.services
 * @description The manager's services: the product read and every write, and
 * the adapter that turns them into the services map
 * `contract-product.machine.ts` invokes. The collection's services are in
 * `contract-products.services.ts`.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useContractProduct.ts` only (`@internal/no-cross-module-imports`).
 */

const CONTRACT_PRODUCT_WITH = join(
  [
    "contract",
    "contract.account",
    "contract.address",
    "contract.brand.currency",
    "contract.cancellation_request.status",
    "contract.cancellation_request.custom_fields.field",
    "contract.client",
    "contract.client.tags",
    "contract.client.image",
    "contract.gateway",
    "contract.import.credentials",
    "contract.import.source",
    "contract.moved_to_contract",
    "contract.moved_to_contract.products",
    "contract.payment_details",
    "contract.payment_details.gateway",
    "contract.promotions",
    "contract.status",
    "allowed_migrations",
    "attributes.product.image",
    "brand",
    "contract_request",
    "contract_request.custom_fields.field",
    "future_cancellation_request",
    "options.product.image",
    "product",
    "product.brand.currency",
    "product.image",
    "product.images",
    "product.provision_blueprint",
    "product.provision_blueprint.category",
    "product.provision_category",
    "scheduled_actions",
    "status",
    "tags",
    "unpaid_recurring_invoices"
  ],
  ","
);

/**
 * Invalidates the module's key and the invoices key, then resolves `result`.
 * Each invalidation is awaited on its own: `invalidateQueryByKey` resolves
 * `undefined` when it fails, which would drop the result from a chain.
 */
async function invalidateWithInvoices<T>(result: T): Promise<T> {
  await invalidateQueryByKey(queryKey, { exact: false })();
  await invalidateQueryByKey(["invoices"], { exact: false })();
  return result;
}

/**
 * The product read, mapped to the view model. It warms the CANCEL_REQUEST
 * fields the cancellation form reads, so the form opens on them at once.
 */
async function load(
  scopeActor: ScopeActorTypes,
  ids: ContractProductIds
): Promise<ContractProduct> {
  const { get, useUrl } = useQuery();
  if (!ids.contractProductId) return Promise.reject(notAvailableError(ids));

  const [contractProduct] = await Promise.all([
    get<IContractProduct, ContractProduct>({
      queryKey: [
        ...queryKey,
        ids.contractId,
        "products",
        ids.contractProductId
      ],
      url: useUrl(`contract_products/${ids.contractProductId}`, {
        with: CONTRACT_PRODUCT_WITH
      }),
      select: raw => mapContractProduct(raw),
      withAccessToken: true,
      staleTime: 0,
      gcTime: 0
    }),
    loadCancellationFields(scopeActor)
  ]);

  return contractProduct;
}

/**
 * The client's addresses and companies, read off their owner modules once both
 * lists are read. The owners are read inside a scope that stops after the
 * read, so no reader outlives it.
 */
async function loadBillingEntities(
  scopeActor: ScopeActorTypes
): Promise<BillingEntityLists> {
  const scope = effectScope(true);
  const read = scope.run(() => {
    const addresses = useClientAddresses().as(scopeActor);
    const companies = useClientCompanies().as(scopeActor);
    const addressList = addresses.useContext().data;
    const companyList = companies.useContext().data;

    return Promise.all([
      addresses.useActions().isReady(),
      companies.useActions().isReady()
    ]).then(() => ({
      addresses: addressList.value,
      companies: companyList.value
    }));
  });

  return (read ?? Promise.resolve({ addresses: [], companies: [] })).finally(
    () => scope.stop()
  );
}

/**
 * The CANCEL_REQUEST fields the cancellation form draws, read off their owner
 * inside a scope that stops after the read. Only a client has them, and a
 * failed read gives an empty form rather than failing its caller.
 */
async function loadCancellationFields(
  scopeActor: ScopeActorTypes
): Promise<CustomField[]> {
  if (scopeActor !== ScopeActorTypes.CLIENT) return [];

  const scope = effectScope(true);
  const read = scope.run(() => {
    const owner = useClientCustomFields()
      .as(scopeActor)
      .for(ClientCustomFieldsContextTypes.CANCEL_REQUEST);
    const fields = owner.useContext().data;

    return owner
      .useActions()
      .isReady()
      .then(() => fields.value);
  });

  return (read ?? Promise.resolve([]))
    .catch((): CustomField[] => [])
    .finally(() => scope.stop());
}

// -----------------------------------------------------------------------------
// Cancellation and consolidation — every write is contract-scoped

async function requestSoftCancel(
  ids: ContractProductIds,
  model: Parameters<ContractProductServices["requestSoftCancel"]>[1]
): Promise<IContractProduct | undefined> {
  const { put, useUrl } = useQuery();
  if (!ids.contractId || !ids.contractProductId) {
    return Promise.reject(notAvailableError(ids));
  }

  return put<IContractProduct>({
    mutationKey: [...queryKey, ids.contractProductId, "modify-renew"],
    url: useUrl(
      `contracts/${ids.contractId}/products/${ids.contractProductId}/modify_renew`
    ),
    data: toSoftCancelBody({
      renew: false,
      reason: model?.reason,
      customFields: model?.customFields
    }),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

async function abortSoftCancel(
  ids: ContractProductIds
): Promise<IContractProduct | undefined> {
  const { put, useUrl } = useQuery();
  if (!ids.contractId || !ids.contractProductId) {
    return Promise.reject(notAvailableError(ids));
  }

  return put<IContractProduct>({
    mutationKey: [...queryKey, ids.contractProductId, "resume-renew"],
    url: useUrl(
      `contracts/${ids.contractId}/products/${ids.contractProductId}/modify_renew`
    ),
    data: toSoftCancelBody({ renew: true }),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

async function setConsolidation(
  ids: ContractProductIds,
  model: Parameters<ContractProductServices["setConsolidation"]>[1]
): Promise<IContractProduct | undefined> {
  const { put, useUrl } = useQuery();
  const invoiceConsolidationEnabled = model?.invoiceConsolidationEnabled;
  if (
    !ids.contractId ||
    !ids.contractProductId ||
    isNil(invoiceConsolidationEnabled)
  ) {
    return Promise.reject(notAvailableError(ids));
  }

  return put<IContractProduct>({
    mutationKey: [...queryKey, ids.contractProductId, "consolidation"],
    url: useUrl(
      `contracts/${ids.contractId}/products/${ids.contractProductId}/properties`
    ),
    data: { invoice_consolidation_enabled: invoiceConsolidationEnabled },
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

async function scheduleCancellation(
  ids: ContractProductIds,
  model: Parameters<ContractProductServices["scheduleCancellation"]>[1]
): Promise<IContractProduct | undefined> {
  const { put, useUrl } = useQuery();
  if (!ids.contractId || !ids.contractProductId) {
    return Promise.reject(notAvailableError(ids));
  }

  return put<IContractProduct>({
    mutationKey: [...queryKey, ids.contractProductId, "schedule-cancel"],
    url: useUrl(
      `contracts/${ids.contractId}/products/${ids.contractProductId}/schedule-cancel`
    ),
    data: toScheduleCancellationBody({
      futureCancellationDate: model?.futureCancellationDate ?? "",
      reason: model?.reason,
      customFields: model?.customFields
    }),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** HARD: `POST contracts/{contractId}/cancel/request` for this one product. */
async function requestCancellation(
  ids: ContractProductIds,
  model: Parameters<ContractProductServices["requestCancellation"]>[1]
): Promise<IContractProduct | undefined> {
  const { post, useUrl } = useQuery();
  if (!ids.contractId || !ids.contractProductId) {
    return Promise.reject(notAvailableError(ids));
  }

  return post<IContractProduct>({
    mutationKey: [...queryKey, ids.contractProductId, "cancel", "request"],
    url: useUrl(`contracts/${ids.contractId}/cancel/request`),
    data: toRequestCancellationBody({
      productIds: [ids.contractProductId],
      reason: model?.reason,
      customFields: model?.customFields
    }),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** `DELETE contracts/{contractId}/cancel/request` with this product's own request id. */
async function withdrawCancellation(
  ids: ContractProductIds,
  requestId: Parameters<ContractProductServices["withdrawCancellation"]>[1]
): Promise<IContractProduct | undefined> {
  const { del, useUrl } = useQuery();
  if (!ids.contractId || !requestId) {
    return Promise.reject(notAvailableError(ids));
  }

  return del<IContractProduct>({
    mutationKey: [...queryKey, ids.contractProductId, "cancel", "withdraw"],
    url: useUrl(`contracts/${ids.contractId}/cancel/request`),
    data: { contract_request_id: requestId },
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

async function revokeScheduledCancellation(
  ids: ContractProductIds
): Promise<IContractProduct | undefined> {
  const { put, useUrl } = useQuery();
  if (!ids.contractId || !ids.contractProductId) {
    return Promise.reject(notAvailableError(ids));
  }

  return put<IContractProduct>({
    mutationKey: [...queryKey, ids.contractProductId, "schedule-cancel-revoke"],
    url: useUrl(
      `contracts/${ids.contractId}/products/${ids.contractProductId}/schedule-cancel-revoke`
    ),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

// -----------------------------------------------------------------------------
// Migration

/** The dry run: the platform prices the change and commits nothing. */
async function previewMigration(input: ChangeProductInput): Promise<IInvoice> {
  const { put, useUrl } = useQuery();

  return put<IInvoice>({
    mutationKey: [...queryKey, input.contractProductId, "change", "preview"],
    url: useUrl(
      `contracts/${input.contractId}/products/${input.contractProductId}/change`
    ),
    data: { ...toChangeProductBody(input), dry_run: true },
    withAccessToken: true
  });
}

/** The commit of the migration. */
async function migrate(
  input: ChangeProductInput
): Promise<IInvoice | undefined> {
  const { put, useUrl } = useQuery();

  return put<IInvoice>({
    mutationKey: [...queryKey, input.contractProductId, "change"],
    url: useUrl(
      `contracts/${input.contractId}/products/${input.contractProductId}/change`
    ),
    data: toChangeProductBody(input),
    withAccessToken: true
  }).then(invalidateWithInvoices);
}

// -----------------------------------------------------------------------------
// Lifecycle writes

/** `{ invoicing }` is the renewal invoicing, not the renewal itself. */
async function setAutoRenew(
  ids: ContractProductIds,
  on: boolean
): Promise<IContractProduct | undefined> {
  const { put, useUrl } = useQuery();
  if (!ids.contractId || !ids.contractProductId) {
    return Promise.reject(notAvailableError(ids));
  }

  return put<IContractProduct>({
    mutationKey: [...queryKey, ids.contractProductId, "auto-renew"],
    url: useUrl(
      `contracts/${ids.contractId}/products/${ids.contractProductId}/stop_start_invoicing`
    ),
    data: { invoicing: on },
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/**
 * The invoice the platform raised, or `null` when it raised none. The body is
 * the next invoice date, when the product has one. `post` resolves the
 * envelope itself when its `data` is `null`; an envelope carries no `id`, so
 * it reads as no invoice.
 */
async function issueNextInvoice(
  ids: ContractProductIds,
  nextInvoiceDate: Parameters<ContractProductServices["issueNextInvoice"]>[1]
): Promise<IInvoice | null> {
  const { post, useUrl } = useQuery();
  if (!ids.contractId || !ids.contractProductId) {
    return Promise.reject(notAvailableError(ids));
  }

  return post<IInvoice | QueryResponse<null> | undefined>({
    mutationKey: [...queryKey, ids.contractProductId, "next-invoice"],
    url: useUrl(
      `contracts/${ids.contractId}/products/${ids.contractProductId}/recurring`
    ),
    data: nextInvoiceDate ? { next_invoice_date: nextInvoiceDate } : undefined,
    withAccessToken: true
  })
    .then(invalidateWithInvoices)
    .then(response =>
      isObject(response) && "id" in response ? response : null
    );
}

/** The invoice the end of trial raised, or `null` when it raised none; see `issueNextInvoice`. */
async function endTrial(ids: ContractProductIds): Promise<IInvoice | null> {
  const { post, useUrl } = useQuery();
  if (!ids.contractId || !ids.contractProductId) {
    return Promise.reject(notAvailableError(ids));
  }

  return post<IInvoice | QueryResponse<null> | undefined>({
    mutationKey: [...queryKey, ids.contractProductId, "end-trial"],
    url: useUrl(
      `contracts/${ids.contractId}/products/${ids.contractProductId}/trial_end_action_manual`
    ),
    withAccessToken: true
  })
    .then(invalidateWithInvoices)
    .then(response =>
      isObject(response) && "id" in response ? response : null
    );
}

/** The product path, not the contract path: the label belongs to the contract product alone. */
async function setClientLabel(
  ids: ContractProductIds,
  model: Parameters<ContractProductServices["setClientLabel"]>[1]
): Promise<IContractProduct | undefined> {
  const { put, useUrl } = useQuery();
  if (!ids.contractProductId) return Promise.reject(notAvailableError(ids));

  return put<IContractProduct>({
    mutationKey: [...queryKey, ids.contractProductId, "client-label"],
    url: useUrl(`contract_products/${ids.contractProductId}`),
    data: model,
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** Resolves the picked id against the owner lists, then writes the contract's address and company. */
async function setBillingEntity(
  scopeActor: ScopeActorTypes,
  ids: ContractProductIds,
  model: Parameters<ContractProductServices["setBillingEntity"]>[1]
): Promise<IContractProduct | undefined> {
  const { put, useUrl } = useQuery();
  const { addresses, companies } = await loadBillingEntities(scopeActor);
  const id = model?.billing_entity;
  const company = find(companies, { id });
  const address = find(addresses, { id });
  const choice = company ? { company } : address && { address };
  if (!ids.contractId || !ids.contractProductId || !choice) {
    return Promise.reject(notAvailableError(ids));
  }

  return put<IContractProduct>({
    mutationKey: [...queryKey, ids.contractProductId, "billing-entity"],
    url: useUrl(`contracts/${ids.contractId}/address_company_vat`),
    data: toBillingEntityBody(choice),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

// -----------------------------------------------------------------------------
// Service Factory

/** Maps a scope actor to its service overrides. Armless today. */
function scopedServices(
  scopeActor: ScopeActorTypes,
  _scopeContext?: ScopeContext
): Partial<ContractProductServices> {
  switch (scopeActor) {
    default:
      return {};
  }
}

/** Services factory for one manager scope; `useContractProduct.ts` calls it once per scope. */
export const createContractProductServices = (
  scopeActor: ScopeActorTypes,
  scopeContext: ScopeContext | undefined
): ContractProductServices => ({
  queryKey,
  load: ids => load(scopeActor, ids),
  loadBillingEntities: () => loadBillingEntities(scopeActor),
  loadCancellationFields: () => loadCancellationFields(scopeActor),
  requestSoftCancel,
  abortSoftCancel,
  requestCancellation,
  withdrawCancellation,
  scheduleCancellation,
  revokeScheduledCancellation,
  setConsolidation,
  previewMigration,
  migrate,
  setAutoRenew,
  issueNextInvoice,
  endTrial,
  setClientLabel,
  setBillingEntity: (ids, model) => setBillingEntity(scopeActor, ids, model),
  ...scopedServices(scopeActor, scopeContext)
});

export default createContractProductServices;

// -----------------------------------------------------------------------------
// Machine-Ready Services (the adapter)

/**
 * Adapts the scoped services object into the XState services map the machine
 * invokes. `service` is threaded in rather than minted here, so every
 * machine-invoked request inherits the scope it was built for.
 */
export const useContractProductMachineServices = (
  service: ContractProductServices
): ContractProductMachineServices => ({
  load: context => service.load(context),
  loadBillingEntities: () => service.loadBillingEntities(),
  loadCancellationFields: () => service.loadCancellationFields(),
  validateCancellation: ({ cancellation }) => validateForm(cancellation),
  validateConsolidation: ({ consolidation }) => validateForm(consolidation),
  validateBillingEntity: ({ billingEntity }) => validateForm(billingEntity),
  validateClientLabel: async (
    _context,
    { data }: AnyEventObject
  ): Promise<ClientLabelModel> => {
    const model = { client_label: data.label };
    await validateForm({ schema: useClientLabelSchema(), model });
    return model;
  },
  requestSoftCancel: context =>
    service.requestSoftCancel(context, context.cancellation?.model),
  abortSoftCancel: context => service.abortSoftCancel(context),
  requestCancellation: context =>
    service.requestCancellation(context, context.cancellation?.model),
  withdrawCancellation: context =>
    service.withdrawCancellation(
      context,
      context.contractProduct?.contractRequest?.id
    ),
  scheduleCancellation: context =>
    service.scheduleCancellation(context, context.cancellation?.model),
  revokeScheduledCancellation: context =>
    service.revokeScheduledCancellation(context),
  setConsolidation: context =>
    service.setConsolidation(context, context.consolidation?.model),
  previewMigration: (context): Promise<IInvoice> => {
    const input = toChangeProductInput(context);
    return input
      ? service.previewMigration(input)
      : Promise.reject(notAvailableError(context));
  },
  migrate: (context): Promise<IInvoice | undefined> => {
    const input = toChangeProductInput(context);
    return input
      ? service.migrate(input)
      : Promise.reject(notAvailableError(context));
  },
  // Reports the configurator child failing, at load or later. The cleanup
  // unsubscribes and leaves the child running: the machine stops it.
  watchMigrationTarget:
    ({ migration }) =>
    (callback): (() => void) => {
      const subscription = migration?.ref?.subscribe(state => {
        if (!stateMatches(state, ["unavailable"])) return;
        callback({
          type: "MIGRATION.UNAVAILABLE",
          data: contextValue(state, "error")
        });
      });
      return () => subscription?.unsubscribe();
    },
  setAutoRenew: (context, { data }: AnyEventObject) =>
    service.setAutoRenew(context, data.on),
  issueNextInvoice: context =>
    service.issueNextInvoice(context, context.contractProduct?.nextInvoiceDate),
  endTrial: context => service.endTrial(context),
  setClientLabel: (context, { data }: AnyEventObject) =>
    service.setClientLabel(context, data),
  setBillingEntity: context =>
    service.setBillingEntity(context, context.billingEntity?.model)
});
