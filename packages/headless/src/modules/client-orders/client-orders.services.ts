/** @internal */
import { keepPreviousData } from "@tanstack/vue-query";
import { computed, ref, watch } from "vue";
import { UUID } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { useQuerySchema } from "./client-orders.schemas";
import { NotAuthenticatedError, useTime } from "../../utils";
import type {
  ClientOrdersListQuery,
  ClientOrdersQueryModel,
  ClientOrdersServices
} from "./client-orders.types";
import type { ResponseError } from "../../utils";
import type { QueryKey } from "@tanstack/vue-query";
import type { IOrder } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-orders/client-orders.services
 * @description The order list read — `GET api/invoices`, forced to the
 * `new_contract` category by the query schema's `const` (design 8.1, 8.3,
 * D-3). Client `self` only (FE-3237 Out of Scope).
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useClientOrders.ts` only (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------

/** The module's base cache key — under the shared `invoices` root (design 8.4, D-4). */
export const queryKey: QueryKey = ["invoices", "client-orders"];

/**
 * `loadList`'s include set — the oracle's own read (design 8.1). `brand` is
 * added at request time only when `isMultibrand` (D-16).
 */
const LOAD_LIST_INCLUDES = "tags,client,client.image,status,products";

/** True while this scope can address a client. */
function isAddressable(clientId?: string): boolean {
  const { isAuthenticated } = useActiveSession().useMeta();

  return isAuthenticated.value && !!clientId;
}

/**
 * The list. Design 6.1 / D-22 — the house brand-settled pattern:
 * `enabled` is gated on a latched settled flag that a self-stopping watch
 * sets once, when `useBrand().brandId` resolves or `useBrand().meta.
 * isComplete` is true. It never waits for success and never polls (`useBrand
 * ().isReady()` is an unbounded poll — [h28]). The guard re-stamps the
 * whole `with` param at request time from the LIVE `isMultibrand`, because
 * `useUrl` freezes its parameters at build ([h27]).
 */
function loadList(): ClientOrdersListQuery {
  const { list, useUrl } = useQuery();
  const { activeUser } = useActiveSession().useContext();
  const clientId = computed(() => activeUser.value?.id);
  const { brandId, meta: brandMeta } = useBrand();
  const isMultibrand = computed(() => brandId.value === UUID.ORG);

  const targetUrl = () =>
    useUrl("invoices", {
      with: isMultibrand.value
        ? `${LOAD_LIST_INCLUDES},brand`
        : LOAD_LIST_INCLUDES,
      with_count: "products"
    });
  const url = targetUrl();

  const brandSettled = ref(false);
  const stopBrandWatch = watch(
    () => brandId.value || brandMeta.value.isComplete,
    settled => {
      if (!settled) return;
      brandSettled.value = true;
      stopBrandWatch();
    },
    { immediate: true }
  );

  return list<IOrder[], IOrder[], ClientOrdersQueryModel>({
    criteria: { schema: useQuerySchema() },
    queryKey: [...queryKey, { client: clientId, brand: brandId }],
    url,
    withAccessToken: true,
    guard: async () => {
      if (!brandSettled.value || !isAddressable(clientId.value)) {
        throw new NotAuthenticatedError();
      }
      if (!brandId.value) throw new NotAuthenticatedError();

      url.search = targetUrl().search;
      return true;
    },
    enabled: () => brandSettled.value && isAddressable(clientId.value),
    staleTime: useTime().DAY,
    placeholderData: keepPreviousData
  });
}

// -----------------------------------------------------------------------------
// Scope-Ready Services

/**
 * One services instance per scope. Armless — one actor (`client`) resolves
 * for this `client x self` module (FE-3237 Out of Scope); no second actor
 * has an exclusive or overriding member, so no `.{actor}.ts` arm is earned.
 */
export const createClientOrdersServices = (): ClientOrdersServices => {
  const { activeUser } = useActiveSession().useContext();

  return {
    queryKey,
    isAvailable: computed(() => isAddressable(activeUser.value?.id)),
    error: computed<ResponseError | undefined>(() => undefined),
    loadList
  };
};

export default createClientOrdersServices;
