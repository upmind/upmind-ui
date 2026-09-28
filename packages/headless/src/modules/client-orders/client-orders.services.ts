/** @internal */
import { keepPreviousData, useQuery as vueUseQuery } from "@tanstack/vue-query";
import { computed, effectScope, getCurrentScope, ref, watch } from "vue";
import { OnlineGatewayTypes } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { isMultibrand } from "./client-orders.mappers";
import { useQuerySchema } from "./client-orders.schemas";
import { NotAuthenticatedError, useTime } from "../../utils";
import { isEmpty } from "lodash-es";
import type {
  ClientOrderGatewaysQuery,
  ClientOrderItemImagesQuery,
  ClientOrderItemQuery,
  ClientOrderServices,
  ClientOrdersListQuery,
  ClientOrdersQueryModel,
  ClientOrdersServices
} from "./client-orders.types";
import type { ResponseError } from "../../utils";
import type { DefaultError, QueryKey } from "@tanstack/vue-query";
import type { IOrder } from "@upmind-automation/types";
import type { Ref } from "vue";

/** The gateway `.type` values the wire's `filter[gateway.type]` csv holds (D-26). */
const ONLINE_GATEWAY_TYPES = OnlineGatewayTypes;
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

  const targetUrl = () =>
    useUrl("invoices", {
      with: isMultibrand() ? `${LOAD_LIST_INCLUDES},brand` : LOAD_LIST_INCLUDES,
      with_count: "products"
    });
  const url = targetUrl();

  // `let` + a no-op initializer, not `const`: `{ immediate: true }` can
  // invoke this callback SYNCHRONOUSLY, before `stop` would otherwise be
  // assigned — calling `stop()` at that point hit a TDZ `ReferenceError`
  // under `const` (F16, `client-custom-fields.services.ts:319-327`).
  const brandSettled = ref(false);
  let stop: () => void = () => {};
  stop = watch(
    () => brandId.value || brandMeta.value.isComplete,
    settled => {
      if (!settled) return;
      brandSettled.value = true;
      stop();
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

// -----------------------------------------------------------------------------
// MANAGER — the single-order read and its three delegated reads
// (design 6.3, 8.1, 8.4, D-14, D-15, D-25, D-26).
// -----------------------------------------------------------------------------

/**
 * The single-order read — `GET api/invoices/{id}` (design 8.1). Publishes
 * the RAW `IOrder` (D-2); the detail/item projections run in the context
 * layer over `client-orders.mappers.ts`, never a query `select`.
 */
function loadOne(orderId?: IOrder["id"]): ClientOrderItemQuery {
  const { query, useUrl } = useQuery();
  const { activeUser } = useActiveSession().useContext();
  const clientId = computed(() => activeUser.value?.id);

  return query<IOrder, IOrder>({
    queryKey: [...queryKey, "order", orderId, { client: clientId }],
    url: useUrl(`invoices/${orderId}`, {
      with_staged_imports: 1,
      with: [
        "account.affiliate_referral.affiliate_account.account.client",
        "affiliate_commissions",
        "brand",
        "client",
        "client.tags",
        "contract",
        "contract_product_tags",
        "custom_fields.field",
        "payments",
        "promotions",
        "status",
        "taxes",
        "taxes.tax_tag_data"
      ].join(",")
    }),
    withAccessToken: true,
    guard: async () => {
      if (!orderId || !isAddressable(clientId.value)) {
        throw new NotAuthenticatedError();
      }
      return true;
    },
    enabled: () => !!orderId && isAddressable(clientId.value),
    staleTime: 0
  });
}

/**
 * The item-catalogue-image read — `GET api/products` (design 8.1, D-14).
 * The linked catalogue product id (`item.product.id`), never the line
 * `id`, is both the request filter and the returned map's key. Reactive
 * over `productIds`, which resolves only once the single read settles —
 * `guard` re-stamps the URL at request time, the same `useUrl`-freezes-at-
 * build pattern `loadList` uses (D-22, [h27]), and the ref itself rides in
 * `queryKey` so a new id list re-keys the query.
 */
function loadItemImages(productIds: Ref<string[]>): ClientOrderItemImagesQuery {
  const { query, useUrl } = useQuery();

  const targetUrl = () =>
    useUrl("products", {
      "filter[id]": productIds.value.join(","),
      with: "image",
      limit: productIds.value.length || 1
    });
  const url = targetUrl();

  return query<
    { id: string; image?: { full_url?: string } }[],
    Record<string, string>
  >({
    queryKey: [...queryKey, "order", "images", productIds],
    url,
    withAccessToken: true,
    guard: async () => {
      url.search = targetUrl().search;
      return true;
    },
    enabled: () => !isEmpty(productIds.value),
    select: rows =>
      rows.reduce<Record<string, string>>((map, row) => {
        if (row.image?.full_url) map[row.id] = row.image.full_url;
        return map;
      }, {}),
    staleTime: useTime().DAY
  });
}

/**
 * D-26 — the online-gateway count. `useQuery().query()` drops the response
 * envelope's `total` through its own `select`, and `list()`'s page window
 * refuses `limit=count`, so this reads over `useQuery().request` directly
 * (the `client-billing-settings` `loadSettings` precedent, [h39]) and keeps
 * the envelope `total` itself.
 */
function loadOnlineGateways(
  brandId: Ref<string | undefined>
): ClientOrderGatewaysQuery {
  const { request, useUrl, queryClient } = useQuery();

  const currentScope = getCurrentScope();
  const scope = currentScope?.active ? currentScope : effectScope(true);

  const response = scope.run(() =>
    vueUseQuery<number, DefaultError, number>(
      {
        queryKey: [...queryKey, "gateways", brandId],
        queryFn: async () => {
          const envelope = await request<unknown>({
            url: useUrl(`brands/${brandId.value}/gateways`, {
              limit: "count",
              "filter[gateway.type]": ONLINE_GATEWAY_TYPES.join(",")
            }),
            withAccessToken: true
          });
          return envelope.total ?? 0;
        },
        enabled: () => !!brandId.value,
        staleTime: useTime().DAY
      },
      queryClient
    )
  )!;

  return {
    data: computed(() => response.data.value ?? 0),
    error: computed(
      () => response.error.value as unknown as ResponseError | undefined
    ),
    isFetched: computed(() => response.isFetched.value),
    isLoading: computed(() => response.isLoading.value)
  };
}

/**
 * One manager services instance per `(actor, id)` scope. Armless — the same
 * one-actor reasoning as {@link createClientOrdersServices}.
 */
export const createClientOrderServices = (
  orderId?: IOrder["id"]
): ClientOrderServices => {
  const { activeUser } = useActiveSession().useContext();

  return {
    queryKey,
    isAvailable: computed(
      () => !!orderId && isAddressable(activeUser.value?.id)
    ),
    error: computed<ResponseError | undefined>(() => undefined),
    loadOne: () => loadOne(orderId),
    loadItemImages,
    loadOnlineGateways
  };
};
