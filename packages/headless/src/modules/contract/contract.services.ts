/** @internal */
import { computed } from "vue";
import { usePaymentDetails } from "../payment-details";
import { invalidateQueryByKey, useQuery } from "../query";
import { resolveClientId, useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
import {
  mapContractLookupItems,
  mapContracts,
  toPaymentMethodBody
} from "./contract.mappers";
import {
  useContractLookupQuerySchema,
  useQuerySchema
} from "./contract.schemas";
import { validateForm } from "./contract.utils";
import {
  DEBOUNCE_DELAY,
  DetailedError,
  ErrorOrigin,
  NotAuthenticatedError,
  responseCodes,
  useTime
} from "../../utils";
import type { ScopeContext } from "../scope";
import type {
  Contract,
  ContractContext,
  ContractLoaded,
  ContractLookups,
  ContractMachineServices,
  ContractServices,
  ContractListQuery,
  ContractsPickerLookupQuery,
  QueryModel,
  SetPaymentMethodModel
} from "./contract.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { IContract } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module contract/contract.services
 * @description The ONE services file both halves consume — the collection's
 * `loadList`, and the read plus three writes `contract.machine.ts` invokes.
 * One cache-key hierarchy (design 8.4); every write invalidates it whole.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useContracts.ts` / `useContract.ts` only (`@internal/no-cross-module-imports`).
 */

/** The module's base cache key (design 8.4). */
export const queryKey: QueryKey = ["contracts"];

/**
 * @decision The embedded `products` relation carries the full mapper's relation
 *   set (FE-3206), matching the sibling `useContractProducts` list.
 * what: each `products.*` member mirrors `CONTRACT_PRODUCTS_LIST_WITH`
 *   (`contract-product.services.ts`) with a `products.` prefix, plus
 *   `products.product.brand.currency`, which the list set lacks, because
 *   `mapContract` now maps every product through the contract-product module's
 *   full `mapContractProduct` — `contract.products[]` is the same
 *   `ContractProduct` view model `useContractProduct` serves, so the read must
 *   supply the relations that mapper reads.
 * why: legacy requests the same per-product relations on its contract-products
 *   read (`vue-app store/modules/data/contracts/products.ts:40-65`
 *   `withParam`): `clients`/`clients.image`/`clients.brand`, `status`,
 *   `product.image`, `brand.currency`, `product.provision_blueprint`,
 *   `contract_request`, `future_cancellation_request`,
 *   `moved_to_contract_product`(`.clients`), `tags`.
 *   `product.provision_blueprint.category` is not in that getter but the mapper
 *   strictly needs it: the title's `useProductName` switches on
 *   `provision_blueprint.category.code` (`product/product.utils.ts:178`).
 * what (payment method): the read also requests `payment_details`, which
 *   `mapContract` maps to `contract.paymentMethod` — `{ id, label }`, the
 *   label legacy's `useTranslateName(payment_details)` reading. Legacy loads
 *   the same relation (`cProdProvider.vue:888`, read by
 *   `cProdPaymentMethodComp.vue:64`).
 * rejected: the former R34 narrowing that dropped `products.contract_request*`
 *   and `products.future_cancellation_request` — it fit the slim list-row stub
 *   mapper, which FE-3206 replaced with the full `ContractProduct` mapper (R21);
 *   also requesting `payment_details.gateway` — the label is the stored
 *   method's own name, and legacy's gateway-name fallback for a contract with
 *   no stored method is out of scope.
 */
const CONTRACT_WITH = [
  "products.clients",
  "products.clients.image",
  "products.clients.brand",
  "products.status",
  "products.product.image",
  "products.product.brand.currency",
  "products.brand.currency",
  "products.product.provision_blueprint",
  "products.product.provision_blueprint.category",
  "products.contract_request",
  "products.future_cancellation_request",
  "products.moved_to_contract_product",
  "products.moved_to_contract_product.clients",
  "products.tags",
  "cancellation_request",
  "client.image",
  "status",
  "cancellation_request.status",
  "payment_details"
].join();

/**
 * @decision The contracts LIST read requests only the relations the view
 *   model's status branch reads; a list row carries no `products`.
 * what: `GET contracts` asks for `status`, `cancellation_request` and
 *   `cancellation_request.status`, so `mapContract` can read `status.code`
 *   and `cancellation_request.status.code` on every row. `products` is not
 *   requested, and a list row maps to `products: []`.
 * why: the mapping law (R19) binds the read to what the view model maps; the
 *   bare list carries `status_id` only and `mapContract` threw on every row
 *   (AC-14). The client's products surface is `useContractProducts`
 *   (`GET contracts_products`, its own 12-member with-list, its own paging
 *   and the delegated force-set); a row of the contracts list is a paging
 *   handle, and the single-contract read (`CONTRACT_WITH`) carries the
 *   products for the one contract that is opened.
 * rejected: reusing `CONTRACT_WITH` on the list — one page of ten contracts
 *   would pull ten nested product trees the collection never reads, and it
 *   would duplicate the products collection without its delegation rules.
 */
const CONTRACT_LIST_WITH = [
  "status",
  "cancellation_request",
  "cancellation_request.status"
].join();

// -----------------------------------------------------------------------------
// COLLECTION

/**
 * The reactive list query, minted once per scope. The whole request state is
 * the declared query schema — filters, sort and pagination (R38 item 13).
 */
function loadList(scopeContext?: ScopeContext): ContractListQuery {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { list, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return list<IContract[], Contract[], QueryModel>({
    criteria: { schema: useQuerySchema() },
    queryKey: [...queryKey, { client: clientId }],
    url: useUrl("contracts", { with: CONTRACT_LIST_WITH }),
    guard: async () =>
      new Promise((resolve, reject) => {
        if (isAuthenticated.value && !!clientId.value) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    withAccessToken: true,
    select: mapContracts,
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAuthenticated.value && !!clientId.value
  });
}

/** Invalidates this module's cache key so every reader refetches. */
async function refresh(): Promise<void> {
  await invalidateQueryByKey(queryKey, { exact: false })(undefined);
}

/**
 * The contracts a picker offers (R38 item 7) — a `listInfinite` over THIS
 * client's own contracts, searched by title. Its own key keeps a search from
 * evicting the rows the listing is showing, as `tickets`' own picker lookup
 * does.
 */
function loadContractLookup(
  scopeContext: ScopeContext | undefined
): ContractsPickerLookupQuery {
  const { listInfinite, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return listInfinite<IContract[], ReturnType<typeof mapContractLookupItems>>({
    criteria: { schema: useContractLookupQuerySchema() },
    queryKey: [...queryKey, "lookups", "contracts", { client: clientId }],
    url: useUrl("contracts", { with: "status" }),
    guard: async () =>
      new Promise((resolve, reject) => {
        if (clientId.value) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    withAccessToken: true,
    select: mapContractLookupItems,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => !!clientId.value
  }) as unknown as ContractsPickerLookupQuery;
}

// -----------------------------------------------------------------------------
// MACHINE — `contract.machine.ts` invokes these by name

function notAvailable(contractId?: IContract["id"]): DetailedError {
  return new DetailedError(
    useI18n().t("error.contract_not_available"),
    responseCodes.Not_Found,
    ErrorOrigin.Headless,
    { contractId }
  );
}

/**
 * `loading` — the raw contract read plus its reused stored-cards lookup, settled
 * together (design 8.4). The lookup degrades to an empty form on any failure and
 * never fails the load.
 */
async function load({ contractId }: ContractContext): Promise<ContractLoaded> {
  if (!contractId) return Promise.reject(notAvailable(contractId));

  const { get, useUrl } = useQuery();

  const [record, lookups] = await Promise.all([
    get<IContract>({
      queryKey: [...queryKey, contractId],
      url: useUrl(`contracts/${contractId}`, {
        with: CONTRACT_WITH,
        with_staged_imports: 1
      }),
      withAccessToken: true,
      staleTime: 0,
      gcTime: 0
    }),
    loadLookups().catch(() => ({}) as ContractLookups)
  ]);

  return { record, lookups };
}

/**
 * The payment-method form's stored cards, REUSED off the client's own
 * `usePaymentDetails` so no new request is issued. `isReady` settles when the
 * reused query fetches, errors, or is disabled, so a lookup that never fetches
 * degrades to an empty form rather than blocking the load.
 */
async function loadLookups(): Promise<ContractLookups> {
  const payments = usePaymentDetails();

  await payments.isReady();

  return { storedPaymentMethods: payments.data.value };
}

/** `changingPaymentMethod.*.validating` — rejects with a 422 on an invalid model. */
async function validatePaymentMethod({
  paymentMethod
}: ContractContext): Promise<void> {
  return validateForm(paymentMethod);
}

/** `changingPaymentMethod.processing.settingPaymentMethod.updating` — `PATCH contracts/{id}/payment_details` (design 8.3). */
async function setPaymentMethod({
  contractId,
  paymentMethod
}: ContractContext): Promise<IContract | undefined> {
  if (!contractId) return Promise.reject(notAvailable(contractId));

  const { patch, useUrl } = useQuery();

  return patch<IContract>({
    mutationKey: [...queryKey, contractId, "payment-method"],
    url: useUrl(`contracts/${contractId}/payment_details`),
    data: toPaymentMethodBody(paymentMethod?.model as SetPaymentMethodModel),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** The XState services map `contract.machine.ts` passes as `services`. */
export const contractMachineServices: ContractMachineServices = {
  load,
  validatePaymentMethod,
  setPaymentMethod
};

// -----------------------------------------------------------------------------
// Service Factory

function scopedServices(
  scopeActor: ScopeActorTypes,
  _scopeContext?: ScopeContext
): Partial<ContractServices> {
  switch (scopeActor) {
    default:
      return {};
  }
}

// -----------------------------------------------------------------------------
// Scope-Ready Services

/**
 * Services factory — the concrete actor and the context it acts upon arrive at
 * construction; `useContracts.ts` calls it once per scope.
 */
export const createContractServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): ContractServices => {
  const { isAuthenticated } = useActiveSession().useMeta();
  const clientId = resolveClientId(scopeContext);

  return {
    queryKey,
    clientId,
    isAvailable: computed(() => isAuthenticated.value && !!clientId.value),
    loadList: () => loadList(scopeContext),
    refresh,
    lookups: {
      contract: () => loadContractLookup(scopeContext)
    },
    ...scopedServices(scopeActor, scopeContext)
  };
};

export default createContractServices;
