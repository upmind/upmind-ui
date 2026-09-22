/** @internal */
import { computed } from "vue";
import { invalidateQueryByKey, useQuery } from "../query";
import { resolveClientId, useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
import {
  mapContracts,
  toPaymentMethodBody,
  toRequestCancellationBody
} from "./contract.mappers";
import { useQuerySchema } from "./contract.schemas";
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
  ContractMachineServices,
  ContractServices,
  ContractListQuery,
  QueryModel,
  RequestCancellationModel,
  SetPaymentMethodModel
} from "./contract.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { IContract } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";
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

const CONTRACT_WITH = [
  "products.contract_request",
  "products.contract_request.custom_fields.field",
  "products.future_cancellation_request",
  "products.product.image",
  "products.product.brand.currency",
  "cancellation_request",
  "cancellation_request.custom_fields.field",
  "products.status",
  "products.tags",
  "client.image",
  "status",
  "cancellation_request.status"
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
 * the declared query schema (pagination only).
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

/** `loading` — the raw contract read. The machine owns freshness (design 8.4). */
async function load({ contractId }: ContractContext): Promise<IContract> {
  if (!contractId) return Promise.reject(notAvailable(contractId));

  const { get, useUrl } = useQuery();

  return get<IContract>({
    queryKey: [...queryKey, contractId],
    url: useUrl(`contracts/${contractId}`, {
      with: CONTRACT_WITH,
      with_staged_imports: 1
    }),
    withAccessToken: true,
    staleTime: 0,
    gcTime: 0
  });
}

/** `processing.requestingCancellation` — `POST contracts/{id}/cancel/request` (design 8.3). */
async function requestCancellation(
  { contractId }: ContractContext,
  { data }: AnyEventObject
): Promise<IContract | undefined> {
  if (!contractId) return Promise.reject(notAvailable(contractId));

  const { post, useUrl } = useQuery();

  return post<IContract>({
    mutationKey: [...queryKey, contractId, "cancel", "request"],
    url: useUrl(`contracts/${contractId}/cancel/request`),
    data: toRequestCancellationBody(data as RequestCancellationModel),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** `processing.withdrawingCancellation` — `DELETE contracts/{id}/cancel/request` (design 8.3). */
async function withdrawCancellation({
  contractId
}: ContractContext): Promise<IContract | undefined> {
  if (!contractId) return Promise.reject(notAvailable(contractId));

  const { del, useUrl } = useQuery();

  return del<IContract>({
    mutationKey: [...queryKey, contractId, "cancel", "withdraw"],
    url: useUrl(`contracts/${contractId}/cancel/request`),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** `processing.settingPaymentMethod` — `PATCH contracts/{id}/payment_details` (design 8.3). */
async function setPaymentMethod(
  { contractId }: ContractContext,
  { data }: AnyEventObject
): Promise<IContract | undefined> {
  if (!contractId) return Promise.reject(notAvailable(contractId));

  const { patch, useUrl } = useQuery();

  return patch<IContract>({
    mutationKey: [...queryKey, contractId, "payment-method"],
    url: useUrl("contracts/payment_details", { clientId: contractId }),
    data: toPaymentMethodBody(data as SetPaymentMethodModel),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** The XState services map `contract.machine.ts` passes as `services`. */
export const contractMachineServices: ContractMachineServices = {
  load,
  requestCancellation,
  withdrawCancellation,
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
    ...scopedServices(scopeActor, scopeContext)
  };
};

export default createContractServices;
