/** @internal */
import { computed } from "vue";
import { ContractStatusCodes } from "@upmind-automation/types";
import { usePersonalDetailsManager } from "../client-personal-details";
import { invalidateQueryByKey, RequestSortDirection, useQuery } from "../query";
import { translateQuery } from "../query/query.utils";
import { ScopeActorTypes } from "../scope/scope.types";
import { resolveClientId, useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
import {
  mapContractProducts,
  toConsolidationBody,
  toScheduleCancellationBody,
  toSoftCancelBody
} from "./contract-product.mappers";
import { useQuerySchema } from "./contract-product.schemas";
import { ContractProductsContextTypes } from "./contract-product.types";
import { resolveExcludeDelegated } from "./contract-product.utils";
import {
  DEBOUNCE_DELAY,
  DetailedError,
  ErrorOrigin,
  NotAuthenticatedError,
  responseCodes,
  useTime
} from "../../utils";
import { join, reject, startsWith } from "lodash-es";
import type {
  ContractProduct,
  ContractProductContext,
  ContractProductListQuery,
  ContractProductMachineServices,
  ContractProductServices,
  QueryModel,
  ScheduleCancellationModel,
  SetConsolidationModel,
  SoftCancelModel
} from "./contract-product.types";
import type { ScopeContext } from "../scope/scope.types";
import type { QueryKey } from "@tanstack/vue-query";
import type {
  ICProdGroup,
  IContractProduct,
  IProductCategory
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";
import type { AnyEventObject } from "xstate";
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
    "product.provision_category",
    "scheduled_actions",
    "status",
    "tags",
    "unpaid_recurring_invoices"
  ],
  ","
);

/** Resolves true only for an authenticated session with an addressable client. */
function isAddressable(clientId?: string): boolean {
  const { isAuthenticated } = useActiveSession().useMeta();

  return isAuthenticated.value && !!clientId;
}

/**
 * The show-delegated preference seam (design 8.5). `client-personal-details`
 * owns the channel; this module owns the meaning of the key. Constructed ONCE
 * per collection scope with `.fresh()`, so it never collides with a consumer's
 * own profile editor. The `DELEGATED` selector context forces the value and
 * never reads the preference.
 */
function createShowDelegatedPreference(scopeContext?: ScopeContext): {
  preference: ComputedRef<boolean | undefined>;
  destroy: () => void;
} {
  if (scopeContext?.type === ContractProductsContextTypes.DELEGATED) {
    return { preference: computed(() => undefined), destroy: () => undefined };
  }

  const manager = usePersonalDetailsManager()
    .as(ScopeActorTypes.CLIENT)
    .fresh();
  manager.useActions().filterFields(["excludeDelegatedProducts"]);

  return {
    preference: computed(
      () => manager.useContext().model.value?.excludeDelegatedProducts
    ),
    destroy: () => manager.useActions().destroy()
  };
}

/** The reactive delegated force-set — read at FIRE time, never snapshotted at mint. */
function excludeDelegatedFor(
  scopeContext: ScopeContext | undefined,
  preference: ComputedRef<boolean | undefined>
): ComputedRef<0 | 1> {
  const { hasDelegatedProducts } = useActiveSession().useMeta();

  return computed(() =>
    resolveExcludeDelegated(
      scopeContext,
      preference.value,
      hasDelegatedProducts.value
    )
  );
}

// -----------------------------------------------------------------------------
// COLLECTION

/**
 * The reactive list query, minted once per scope. The KEY carries the refs, so
 * a late client id or a changed preference re-keys into its own cache entry;
 * the URL is re-pointed in the `guard`, the last hook before the request is
 * built, so the wire carries the value resolved at fire time.
 */
function loadList(
  scopeContext: ScopeContext | undefined,
  preference: ComputedRef<boolean | undefined>
): ContractProductListQuery {
  const { list, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);
  const excludeDelegated = excludeDelegatedFor(scopeContext, preference);
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
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        url.searchParams.set("exclude_delegated", `${excludeDelegated.value}`);
        resolve(true);
      }),
    withAccessToken: true,
    withSplitCount: true,
    select: mapContractProducts,
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAddressable(clientId.value)
  });
}

/** The dashboard's grouped counts (design 8.1, ADR-4). No `exclude_delegated`. */
async function loadGroupedCounts(
  scopeContext?: ScopeContext
): Promise<ICProdGroup[]> {
  const { get, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const { filters } = translateQuery(useQuerySchema(), {
    filters: { "status.code": ContractStatusCodes.ACTIVE }
  } satisfies QueryModel);

  return get<ICProdGroup[], ICProdGroup[]>({
    queryKey: [...queryKey, { client: clientId.value }, "grouped"],
    url: useUrl(`clients/${clientId.value}/contracts/products`, {
      limit: "count",
      group_count: "products.category_id,service_identifier",
      with: CONTRACT_PRODUCTS_GROUPED_WITH
    }),
    sort: [RequestSortDirection.ASC, "service_identifier"],
    filters,
    withAccessToken: true
  });
}

/** The purchased categories (R10, ADR-20) — the SAME force-set the list sends. */
async function loadPurchasedCategories(
  scopeContext: ScopeContext | undefined,
  preference: ComputedRef<boolean | undefined>
): Promise<IProductCategory[]> {
  const { get, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);
  const excludeDelegated = excludeDelegatedFor(scopeContext, preference);

  if (!isAddressable(clientId.value)) {
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
 * Services factory — the concrete actor and the context it acts upon arrive
 * first, at construction. `useContractProducts.ts` calls it once per scope.
 */
export const createContractProductServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): ContractProductServices => {
  const clientId = resolveClientId(scopeContext);
  const { preference, destroy: destroyPreference } =
    createShowDelegatedPreference(scopeContext);

  return {
    queryKey,
    clientId,
    isAvailable: computed(() => isAddressable(clientId.value)),
    loadList: () => loadList(scopeContext, preference),
    loadGroupedCounts: () => loadGroupedCounts(scopeContext),
    loadPurchasedCategories: () =>
      loadPurchasedCategories(scopeContext, preference),
    destroyPreference,
    ...scopedServices(scopeActor, scopeContext)
  };
};

export default createContractProductServices;

// -----------------------------------------------------------------------------
// Machine services (manager half) — each returns the RAW record; the machine maps

function notAvailable(context: ContractProductContext): DetailedError {
  const { t } = useI18n();

  return new DetailedError(
    t("error.contract_product_not_available"),
    responseCodes.Not_Found,
    ErrorOrigin.Headless,
    {
      contractId: context.contractId,
      contractProductId: context.contractProductId
    }
  );
}

/** `loading` — the 35-member client detail read (design 8.1, ADR-29). */
async function load(
  context: ContractProductContext
): Promise<IContractProduct> {
  const { get, useUrl } = useQuery();
  if (!context.contractProductId) return Promise.reject(notAvailable(context));

  return get<IContractProduct>({
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
  });
}

/**
 * @decision
 * what: every write below is contract-scoped, `contracts/{c}/products/{p}/…`.
 * why: the legacy `apiPath({ contractId, contractProductId }).contextual`
 *   getter resolves that form whenever a contract id is supplied, and both
 *   client callers of the two scheduled-cancellation writes always supply one
 *   (R18; operator correction 2026-09-19).
 * rejected: the bare `contract_products/{p}/schedule-cancel[-revoke]` path
 *   that design 8.3 and parity rows P23/P24 still carry — stale against the
 *   oracle, a planner finding rather than a re-plan.
 */
function productUrl(
  context: ContractProductContext,
  action: string
): Promise<URL> {
  const { useUrl } = useQuery();
  if (!context.contractId || !context.contractProductId) {
    return Promise.reject(notAvailable(context));
  }

  return Promise.resolve(
    useUrl(
      `contracts/${context.contractId}/products/${context.contractProductId}/${action}`
    )
  );
}

/** `processing.stoppingRenewal` — `{ renew: false }` plus what the client supplied. */
async function requestSoftCancel(
  context: ContractProductContext,
  event: AnyEventObject
): Promise<IContractProduct | undefined> {
  const { put } = useQuery();
  const model = event.data as Omit<SoftCancelModel, "renew"> | undefined;

  return put<IContractProduct>({
    mutationKey: [...queryKey, context.contractProductId, "modify-renew"],
    url: await productUrl(context, "modify_renew"),
    data: toSoftCancelBody({ ...model, renew: false }),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** `processing.resumingRenewal` — `{ renew: true }`. */
async function abortSoftCancel(
  context: ContractProductContext
): Promise<IContractProduct | undefined> {
  const { put } = useQuery();

  return put<IContractProduct>({
    mutationKey: [...queryKey, context.contractProductId, "resume-renew"],
    url: await productUrl(context, "modify_renew"),
    data: toSoftCancelBody({ renew: true }),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** `processing.settingConsolidation`. */
async function setConsolidation(
  context: ContractProductContext,
  event: AnyEventObject
): Promise<IContractProduct | undefined> {
  const { put } = useQuery();
  const model = event.data as SetConsolidationModel;

  return put<IContractProduct>({
    mutationKey: [...queryKey, context.contractProductId, "consolidation"],
    url: await productUrl(context, "properties"),
    data: toConsolidationBody(model),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** `processing.schedulingCancellation` (R18). */
async function scheduleCancellation(
  context: ContractProductContext,
  event: AnyEventObject
): Promise<IContractProduct | undefined> {
  const { put } = useQuery();
  const model = event.data as ScheduleCancellationModel;

  return put<IContractProduct>({
    mutationKey: [...queryKey, context.contractProductId, "schedule-cancel"],
    url: await productUrl(context, "schedule-cancel"),
    data: toScheduleCancellationBody(model),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** `processing.revokingScheduledCancellation` (R18). No body. */
async function revokeScheduledCancellation(
  context: ContractProductContext
): Promise<IContractProduct | undefined> {
  const { put } = useQuery();

  return put<IContractProduct>({
    mutationKey: [
      ...queryKey,
      context.contractProductId,
      "schedule-cancel-revoke"
    ],
    url: await productUrl(context, "schedule-cancel-revoke"),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** The services map `contract-product.machine.ts` invokes, keyed by `invoke.src`. */
export const contractProductMachineServices: ContractProductMachineServices = {
  load,
  requestSoftCancel,
  abortSoftCancel,
  setConsolidation,
  scheduleCancellation,
  revokeScheduledCancellation
};
