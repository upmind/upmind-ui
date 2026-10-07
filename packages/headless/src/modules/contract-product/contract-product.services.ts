/** @internal */
import { useBrand } from "../brand";
import {
  ClientCustomFieldsContextTypes,
  useClientCustomFields
} from "../client-custom-fields";
import { invalidateQueryByKey, useQuery, useQueryCriteria } from "../query";
import { ScopeActorTypes } from "../scope/scope.types";
import { useActiveSession } from "../session-store";
import {
  mapContractProductPickerItems,
  mapContractProducts,
  toConsolidationBody,
  toRequestCancellationBody,
  toScheduleCancellationBody,
  toSoftCancelBody
} from "./contract-product.mappers";
import {
  useContractProductPickerQuerySchema,
  useGroupedCountsQuerySchema,
  useQuerySchema
} from "./contract-product.schemas";
import {
  buildChangeProductBody,
  notAvailableError,
  validateForm,
  watchMigrationTarget
} from "./contract-product.utils";
import { DEBOUNCE_DELAY, NotAuthenticatedError, useTime } from "../../utils";
import { join, reject, startsWith } from "lodash-es";
import type {
  CancellationModel,
  ContractProduct,
  ContractProductContext,
  ContractProductListQuery,
  ContractProductLoaded,
  ContractProductLookups,
  ContractProductMachineServices,
  ContractProductPickerLookupQuery,
  ContractProductPickerQueryModel,
  ContractProductServices,
  QueryModel,
  SetConsolidationModel,
  ShowDelegatedPreference
} from "./contract-product.types";
import type { LookupItem } from "../lookup";
import type { ProductModel } from "../product";
import type { ScopeContext } from "../scope/scope.types";
import type { QueryKey } from "@tanstack/vue-query";
import type {
  ICProdGroup,
  IContractProduct,
  IInvoice,
  IProductCategory
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/contract-product.services
 * @description The ONE services file both halves consume — the collection's
 * list, grouped-counts and purchased-category reads, and the machine services
 * `contract-product.machine.ts` invokes (the product read and the five writes
 * of design 8.3). One factory: one identity seam, one cache key.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useContractProducts.ts` / `useContractProduct.ts` only
 * (`@internal/no-cross-module-imports`).
 */

/** The module's base cache key (design 8.4). Every write invalidates it whole. */
export const queryKey: QueryKey = ["contracts"];

const CONTRACT_PRODUCTS_LIST_WITH = [
  "clients",
  "clients.image",
  "clients.brand",
  "status",
  "product.image",
  "brand.currency",
  "product.provision_blueprint",
  "product.provision_blueprint.category",
  "contract_request",
  "future_cancellation_request",
  "moved_to_contract_product",
  "moved_to_contract_product.clients",
  "tags"
];

const CONTRACT_PRODUCTS_GROUPED_WITH = join(
  reject(CONTRACT_PRODUCTS_LIST_WITH, member => startsWith(member, "clients")),
  ","
);

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

// -----------------------------------------------------------------------------
// COLLECTION

/**
 * The reactive list query, minted once per scope. The KEY carries the refs, so
 * a late client id or a changed preference re-keys into its own cache entry;
 * the URL is re-pointed in the `guard`, the last hook before the request is
 * built, so the wire carries the value resolved at fire time.
 */
function loadList(
  clientId: ComputedRef<string | undefined>,
  preference: ShowDelegatedPreference
): ContractProductListQuery {
  const { list, useUrl } = useQuery();
  const { isAuthenticated } = useActiveSession().useMeta();
  const { excludeDelegated } = preference;
  const { taxType } = useBrand();
  const url = useUrl("contracts_products", {
    with: join(CONTRACT_PRODUCTS_LIST_WITH, ","),
    split_count: 1
  });

  return list<IContractProduct[], ContractProduct[], QueryModel>({
    criteria: { schema: useQuerySchema() },
    queryKey: [
      ...queryKey,
      { client: clientId },
      "products",
      { excludeDelegated }
    ],
    url,
    // Must stay an `async` function — `list()` detects a guard by `isPromise`.
    // The split count reads through this guard un-gated by `enabled`, so it
    // waits here for the stored preference the page read is enabled on.
    guard: async () => {
      if (!isAuthenticated.value || !clientId.value) {
        throw new NotAuthenticatedError();
      }
      await preference.whenSettled();
      url.searchParams.set("exclude_delegated", `${excludeDelegated.value}`);
      return true;
    },
    withAccessToken: true,
    withSplitCount: true,
    select: raw => mapContractProducts(raw, taxType.value),
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () =>
      isAuthenticated.value && !!clientId.value && preference.isSettled.value
  });
}

/** The dashboard's grouped counts (design 8.1, ADR-4). No `exclude_delegated`. */
async function loadGroupedCounts(
  clientId: ComputedRef<string | undefined>
): Promise<ICProdGroup[]> {
  const { request, useUrl } = useQuery();
  const { isAuthenticated } = useActiveSession().useMeta();

  if (!isAuthenticated.value || !clientId.value) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const { props } = useQueryCriteria({
    schema: useGroupedCountsQuerySchema()
  });

  // `limit: "count"` is the API's count-mode switch, not a page size (R36):
  // it returns `data: []` and rides the grouped rows on the envelope's
  // `total`, unreachable through `get`'s `select`. Read the whole envelope
  // via `request` (legacy `products.ts` reads the same `total` channel).
  const response = await request<ICProdGroup[]>({
    url: useUrl(`clients/${clientId.value}/contracts/products`, {
      limit: "count",
      group_count: "products.category_id,service_identifier",
      with: CONTRACT_PRODUCTS_GROUPED_WITH
    }),
    sort: props.value.sort,
    filters: props.value.filters,
    withAccessToken: true
  });

  return (response.total as unknown as ICProdGroup[] | null) ?? [];
}

/** The purchased categories (R10, ADR-20) — the SAME force-set the list sends. */
async function loadPurchasedCategories(
  clientId: ComputedRef<string | undefined>,
  preference: ShowDelegatedPreference
): Promise<IProductCategory[]> {
  const { get, useUrl } = useQuery();
  const { isAuthenticated } = useActiveSession().useMeta();
  const { excludeDelegated } = preference;

  if (!isAuthenticated.value || !clientId.value) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return get<IProductCategory[], IProductCategory[]>({
    queryKey: [
      ...queryKey,
      { client: clientId.value },
      "categories",
      { excludeDelegated: excludeDelegated.value }
    ],
    url: useUrl("contract_product_categories", {
      exclude_delegated: excludeDelegated.value
    }),
    withAccessToken: true
  });
}

/**
 * The `contractProductPicker`'s own lookup (R38 item 2) — THIS client's own
 * contract products, searched by service identifier, as `useTickets`'
 * `loadContractProductLookup` searches the same resource for a different
 * caller. Minted on the picker's first call.
 *
 * @decision
 * what: the picker sends the list's own `exclude_delegated` force-set (the
 *   show-delegated preference, or the `DELEGATED` context's forced value),
 *   read at fire time.
 * why: the picker finds a product the list page shows; a hardcoded `1` hid a
 *   delegated product the list offered to a client who opted to see them (W1).
 * rejected: a hardcoded `exclude_delegated=1`; omitting the param (the
 *   platform then returns delegated products whatever the preference).
 */
function loadContractProductPickerLookup(
  clientId: ComputedRef<string | undefined>,
  preference: ShowDelegatedPreference
): ContractProductPickerLookupQuery {
  const { listInfinite, useUrl } = useQuery();
  const { isAuthenticated } = useActiveSession().useMeta();
  const { excludeDelegated } = preference;
  const url = useUrl("contracts_products", { client_id: clientId.value });

  return listInfinite<
    IContractProduct[],
    LookupItem[],
    ContractProductPickerQueryModel
  >({
    criteria: { schema: useContractProductPickerQuerySchema() },
    queryKey: [
      ...queryKey,
      "lookups",
      "contract-products",
      { client: clientId },
      { excludeDelegated }
    ],
    url,
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!isAuthenticated.value || !clientId.value) {
          reject(new NotAuthenticatedError());
          return;
        }
        url.searchParams.set("exclude_delegated", `${excludeDelegated.value}`);
        resolve(true);
      }),
    select: mapContractProductPickerItems,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAuthenticated.value && !!clientId.value
  }) as unknown as ContractProductPickerLookupQuery;
}

// -----------------------------------------------------------------------------
// Service Factory

/**
 * Service matrix: maps scopeActor types to their service implementations. The
 * shape is the same armed or armless — an armless module has only the
 * `default:` case (design 8.8).
 */
function scopedServices(
  scopeActor: ScopeActorTypes,
  _scopeContext?: ScopeContext
): Partial<ContractProductServices> {
  switch (scopeActor) {
    default:
      return {};
  }
}

/**
 * Services factory — the concrete actor, the context it acts upon, and the
 * client id and preference `useContractProducts.ts` resolves for that scope.
 * `useContractProducts.ts` calls it once per scope.
 */
export const createContractProductServices = (
  scopeActor: ScopeActorTypes,
  scopeContext: ScopeContext | undefined,
  clientId: ComputedRef<string | undefined>,
  preference: ShowDelegatedPreference
): ContractProductServices => {
  return {
    queryKey,
    loadList: () => loadList(clientId, preference),
    loadGroupedCounts: () => loadGroupedCounts(clientId),
    loadPurchasedCategories: () =>
      loadPurchasedCategories(clientId, preference),
    lookups: {
      contractProduct: () =>
        loadContractProductPickerLookup(clientId, preference)
    },
    ...scopedServices(scopeActor, scopeContext)
  };
};

export default createContractProductServices;

// -----------------------------------------------------------------------------
// Machine services (manager half) — each returns the RAW record; the machine maps

/**
 * `loading` — the 35-member client detail read (design 8.1, ADR-29) plus its
 * reused CANCEL_REQUEST field lookups, settled together. The lookup degrades to
 * an empty form on any failure and never fails the load.
 */
async function load(
  context: ContractProductContext
): Promise<ContractProductLoaded> {
  const { get, useUrl } = useQuery();
  if (!context.contractProductId)
    return Promise.reject(notAvailableError(context));

  const [record, lookups] = await Promise.all([
    get<IContractProduct>({
      queryKey: [
        ...queryKey,
        context.contractId,
        "products",
        context.contractProductId
      ],
      url: useUrl(`contract_products/${context.contractProductId}`, {
        with: CONTRACT_PRODUCT_WITH
      }),
      withAccessToken: true,
      staleTime: 0,
      gcTime: 0
    }),
    loadLookups().catch(() => ({}) as ContractProductLookups)
  ]);

  return { record, lookups };
}

/**
 * The schedule-cancel form's fields, REUSED off the client's CANCEL_REQUEST
 * definitions so no new request is issued.
 */
async function loadLookups(): Promise<ContractProductLookups> {
  const cancelFields = useClientCustomFields()
    .as(ScopeActorTypes.CLIENT)
    .for(ClientCustomFieldsContextTypes.CANCEL_REQUEST);
  const { isReady } = cancelFields.useActions();
  const { data: customFields } = cancelFields.useContext();

  await isReady();

  return { customFields: customFields.value };
}

async function validateCancellation({ cancellation }: ContractProductContext) {
  return validateForm(cancellation);
}

async function validateConsolidation({
  consolidation
}: ContractProductContext) {
  return validateForm(consolidation);
}

/**
 * `processing.stoppingRenewal.updating` (SOFT) — `{ renew: false }` plus what
 * the form carried.
 *
 * @decision
 * what: every write below is contract-scoped, `contracts/{c}/products/{p}/…`.
 * why: the legacy `apiPath({ contractId, contractProductId }).contextual`
 *   getter resolves that form whenever a contract id is supplied, and both
 *   client callers of the two scheduled-cancellation writes always supply one
 *   (R18; operator correction 2026-09-19).
 * rejected: the bare `contract_products/{p}/schedule-cancel[-revoke]` path.
 *   design 8.3 and parity rows P23/P24 now carry this same contract-scoped
 *   form (corrected 2026-09-22) — this block's earlier "stale against the
 *   oracle" note was itself wrong and is withdrawn.
 */
async function requestSoftCancel(
  context: ContractProductContext
): Promise<IContractProduct | undefined> {
  const { put, useUrl } = useQuery();
  if (!context.contractId || !context.contractProductId) {
    return Promise.reject(notAvailableError(context));
  }
  const model = context.cancellation?.model as CancellationModel;

  return put<IContractProduct>({
    mutationKey: [...queryKey, context.contractProductId, "modify-renew"],
    url: useUrl(
      `contracts/${context.contractId}/products/${context.contractProductId}/modify_renew`
    ),
    data: toSoftCancelBody({
      renew: false,
      reason: model?.reason,
      customFields: model?.customFields
    }),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** `processing.resumingRenewal` — `{ renew: true }`. */
async function abortSoftCancel(
  context: ContractProductContext
): Promise<IContractProduct | undefined> {
  const { put, useUrl } = useQuery();
  if (!context.contractId || !context.contractProductId) {
    return Promise.reject(notAvailableError(context));
  }

  return put<IContractProduct>({
    mutationKey: [...queryKey, context.contractProductId, "resume-renew"],
    url: useUrl(
      `contracts/${context.contractId}/products/${context.contractProductId}/modify_renew`
    ),
    data: toSoftCancelBody({ renew: true }),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** `processing.settingConsolidation.updating` — the model is parsed and validated first. */
async function setConsolidation(
  context: ContractProductContext
): Promise<IContractProduct | undefined> {
  const { put, useUrl } = useQuery();
  if (!context.contractId || !context.contractProductId) {
    return Promise.reject(notAvailableError(context));
  }
  const model = context.consolidation?.model as SetConsolidationModel;

  return put<IContractProduct>({
    mutationKey: [...queryKey, context.contractProductId, "consolidation"],
    url: useUrl(
      `contracts/${context.contractId}/products/${context.contractProductId}/properties`
    ),
    data: toConsolidationBody(model),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** `processing.schedulingCancellation.updating` (R18) — the cancellation model is parsed and validated first. */
async function scheduleCancellation(
  context: ContractProductContext
): Promise<IContractProduct | undefined> {
  const { put, useUrl } = useQuery();
  if (!context.contractId || !context.contractProductId) {
    return Promise.reject(notAvailableError(context));
  }
  const model = context.cancellation?.model as CancellationModel;

  return put<IContractProduct>({
    mutationKey: [...queryKey, context.contractProductId, "schedule-cancel"],
    url: useUrl(
      `contracts/${context.contractId}/products/${context.contractProductId}/schedule-cancel`
    ),
    data: toScheduleCancellationBody({
      futureCancellationDate: model?.futureCancellationDate ?? "",
      reason: model?.reason,
      customFields: model?.customFields
    }),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/**
 * `processing.requestingCancellation.updating` (HARD, R33) —
 * `POST contracts/{contractId}/cancel/request` for this one product. The
 * cancellation model is parsed and validated first.
 */
async function requestCancellation(
  context: ContractProductContext
): Promise<IContractProduct | undefined> {
  const { post, useUrl } = useQuery();
  if (!context.contractId || !context.contractProductId) {
    return Promise.reject(notAvailableError(context));
  }
  const model = context.cancellation?.model as CancellationModel;

  return post<IContractProduct>({
    mutationKey: [...queryKey, context.contractProductId, "cancel", "request"],
    url: useUrl(`contracts/${context.contractId}/cancel/request`),
    data: toRequestCancellationBody({
      productIds: [context.contractProductId],
      reason: model?.reason,
      customFields: model?.customFields
    }),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/**
 * `processing.withdrawingCancellation` (R33) —
 * `DELETE contracts/{contractId}/cancel/request` with this product's own
 * `contract_request` id (legacy `cProdProvider.vue:1327-1362`). No form.
 */
async function withdrawCancellation(
  context: ContractProductContext
): Promise<IContractProduct | undefined> {
  const { del, useUrl } = useQuery();
  const requestId = context.contractProduct?.contractRequest?.id;
  if (!context.contractId || !requestId) {
    return Promise.reject(notAvailableError(context));
  }

  return del<IContractProduct>({
    mutationKey: [...queryKey, context.contractProductId, "cancel", "withdraw"],
    url: useUrl(`contracts/${context.contractId}/cancel/request`),
    data: { contract_request_id: requestId },
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** `processing.revokingScheduledCancellation` (R18). No body. */
async function revokeScheduledCancellation(
  context: ContractProductContext
): Promise<IContractProduct | undefined> {
  const { put, useUrl } = useQuery();
  if (!context.contractId || !context.contractProductId) {
    return Promise.reject(notAvailableError(context));
  }

  return put<IContractProduct>({
    mutationKey: [
      ...queryKey,
      context.contractProductId,
      "schedule-cancel-revoke"
    ],
    url: useUrl(
      `contracts/${context.contractId}/products/${context.contractProductId}/schedule-cancel-revoke`
    ),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** `configuring.previewing` — the dry run: the platform prices the change and commits nothing. */
async function previewMigration(
  context: ContractProductContext
): Promise<IInvoice> {
  const { put, useUrl } = useQuery();
  if (!context.contractId || !context.contractProductId) {
    return Promise.reject(notAvailableError(context));
  }

  return put<IInvoice>({
    mutationKey: [...queryKey, context.contractProductId, "change", "preview"],
    url: useUrl(
      `contracts/${context.contractId}/products/${context.contractProductId}/change`
    ),
    data: {
      ...buildChangeProductBody({
        contractId: context.contractId,
        contractProductId: context.contractProductId,
        targetId: context.migration?.target?.id as string,
        model: context.migration?.model as ProductModel,
        rawProduct: context.migration?.rawProduct,
        currentOptions: context.contractProduct?.currentOptions,
        currencyId: context.contractProduct?.contractCurrencyId
      }),
      dry_run: true
    },
    withAccessToken: true
  });
}

/** `configuring.processing.sending` (AC-31) — the commit of the change of product. */
async function migrate(
  context: ContractProductContext
): Promise<IInvoice | undefined> {
  const { put, useUrl } = useQuery();
  if (!context.contractId || !context.contractProductId) {
    return Promise.reject(notAvailableError(context));
  }

  return put<IInvoice>({
    mutationKey: [...queryKey, context.contractProductId, "change"],
    url: useUrl(
      `contracts/${context.contractId}/products/${context.contractProductId}/change`
    ),
    data: buildChangeProductBody({
      contractId: context.contractId,
      contractProductId: context.contractProductId,
      targetId: context.migration?.target?.id as string,
      model: context.migration?.model as ProductModel,
      rawProduct: context.migration?.rawProduct,
      currentOptions: context.contractProduct?.currentOptions,
      currencyId: context.contractProduct?.contractCurrencyId
    }),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** The services map `contract-product.machine.ts` invokes, keyed by `invoke.src`. */
export const contractProductMachineServices: ContractProductMachineServices = {
  load,
  validateCancellation,
  validateConsolidation,
  requestSoftCancel,
  abortSoftCancel,
  requestCancellation,
  withdrawCancellation,
  setConsolidation,
  scheduleCancellation,
  revokeScheduledCancellation,
  previewMigration,
  migrate,
  watchMigrationTarget
};
