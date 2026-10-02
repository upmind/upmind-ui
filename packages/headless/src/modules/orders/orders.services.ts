/** @internal */
import { keepPreviousData } from "@tanstack/vue-query";
import { computed, effectScope, getCurrentScope, ref, watch } from "vue";
import { OnlineGatewayTypes } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { isMultibrand } from "./orders.mappers";
import { useQuerySchema } from "./orders.schemas";
import { NotAuthenticatedError, useTime } from "../../utils";
import { isEmpty, reduce } from "lodash-es";
import type {
  OrderGatewaysQuery,
  OrderItemImagesQuery,
  OrderItemQuery,
  OrdersListQuery,
  OrdersQueryModel,
  OrdersServices
} from "./orders.types";
import type { ResponseError } from "../../utils";
import type { ScopeContext } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { IOrder } from "@upmind-automation/types";
import type { Ref } from "vue";

/** The gateway `.type` values the wire's `filter[gateway.type]` csv holds (D-26). */
const ONLINE_GATEWAY_TYPES = OnlineGatewayTypes;
// -----------------------------------------------------------------------------
/**
 * @module orders/orders.services
 * @description The ONE services file both halves consume — the order list
 * read (`GET api/invoices`, forced to the `new_contract` category by the
 * query schema's `const`, design 8.1, 8.3, D-3) and the single-order manager's
 * read plus its three delegated reads (design 6.3, 8.1, 8.4). Client `self`
 * only (FE-3237 Out of Scope).
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useOrders.ts` / `useOrder.ts` only
 * (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------

/** The module's base cache key — under the shared `invoices` root (design 8.4, D-4). */
export const queryKey: QueryKey = ["invoices", "orders"];

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
function loadList(): OrdersListQuery {
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

  return list<IOrder[], IOrder[], OrdersQueryModel>({
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
// MANAGER — the single-order read and its three delegated reads
// (design 6.3, 8.1, 8.4, D-14, D-15, D-25, D-26).
// -----------------------------------------------------------------------------

/**
 * The single-order read — `GET api/invoices/{id}` (design 8.1). Publishes
 * the RAW `IOrder` (D-2), or `undefined` when no record resolves (design
 * 8.11); the detail/item projections run in the context layer over
 * `orders.mappers.ts`, never a query `select`.
 */
function loadOne(orderId?: IOrder["id"]): OrderItemQuery {
  const { query, useUrl } = useQuery();
  const { activeUser } = useActiveSession().useContext();
  const clientId = computed(() => activeUser.value?.id);

  const response = query<IOrder, IOrder>({
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

  // The query core substitutes `[]` for absent data; a single record has no
  // empty-array form, so anything without an `id` publishes as `undefined`.
  return {
    ...response,
    data: computed(() =>
      response.data.value?.id ? response.data.value : undefined
    )
  };
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
function loadItemImages(productIds: Ref<string[]>): OrderItemImagesQuery {
  const { query, useUrl } = useQuery();

  /**
   * @decision
   * what: `filter[id]` addresses the exact catalogue product ids the snapshot
   *   items name — an internal structural lookup, NOT a user-facing filter, so
   *   it is written straight into `useUrl` and carries no criteria schema.
   * why: the id set is derived by the module (D-14), never entered by a client;
   *   a schema leaf would model a search surface that does not exist.
   * rejected: routing this through a `list()` criteria schema (invents a public
   *   filter for an id-batch fetch).
   */
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
      reduce(
        rows,
        (map, row) => {
          if (row.image?.full_url) map[row.id] = row.image.full_url;
          return map;
        },
        {} as Record<string, string>
      ),
    staleTime: useTime().DAY
  });
}

/**
 * D-26 — the online-gateway count. The wrapper's `query()`/`list()` publish
 * only the response `data`, never the envelope `total` a `limit=count` read
 * rides on, so this drives the read through the wrapper's own `request` +
 * `queryClient.fetchQuery` (the `contract-product` `loadGroupedCounts`
 * precedent) and keeps the envelope `total` itself. Reactive over `brandId`:
 * the count re-reads once the single order read resolves the order's brand.
 */
function loadOnlineGateways(
  brandId: Ref<string | undefined>
): OrderGatewaysQuery {
  const { request, useUrl, queryClient } = useQuery();

  // Own a detached scope only off the no-active-scope path; `destroy()` stops
  // it through `stop` below, so it never outlives the manager (review finding).
  const currentScope = getCurrentScope();
  const ownScope = currentScope?.active ? undefined : effectScope(true);
  const scope = ownScope ?? currentScope!;

  const total = ref(0);
  const error = ref<ResponseError | undefined>(undefined);
  const isFetched = ref(false);
  const isLoading = ref(false);

  scope.run(() =>
    watch(
      brandId,
      id => {
        if (!id) return;
        isLoading.value = true;
        error.value = undefined;
        queryClient
          .fetchQuery<number>({
            queryKey: [...queryKey, "gateways", id],
            queryFn: async () => {
              const envelope = await request<unknown>({
                /**
                 * @decision
                 * what: `filter[gateway.type]` names the online gateway `.type`
                 *   values (D-26) — an internal structural lookup, NOT a user
                 *   filter, so it is written straight into `useUrl` with no schema.
                 * why: this read counts online gateways for the order's brand; the
                 *   type set is a module constant, never client input.
                 * rejected: a criteria schema leaf (models a public filter that
                 *   this count read does not expose).
                 */
                url: useUrl(`brands/${id}/gateways`, {
                  limit: "count",
                  "filter[gateway.type]": ONLINE_GATEWAY_TYPES.join(",")
                }),
                withAccessToken: true
              });
              return envelope.total ?? 0;
            },
            staleTime: useTime().DAY
          })
          .then(count => {
            total.value = count;
            isFetched.value = true;
          })
          .catch((caught: unknown) => {
            error.value = caught as ResponseError;
          })
          .finally(() => {
            isLoading.value = false;
          });
      },
      { immediate: true }
    )
  );

  return {
    data: computed(() => total.value),
    error: computed(() => error.value),
    isFetched: computed(() => isFetched.value),
    isLoading: computed(() => isLoading.value),
    stop: () => ownScope?.stop()
  };
}

// -----------------------------------------------------------------------------
// Scope-Ready Services

/**
 * Actor-specific overrides, resolved by scope actor. Armless — one actor
 * (`client`) resolves for this `client x self` module (FE-3237 Out of
 * Scope); no second actor has an exclusive or overriding member, so no
 * `.{actor}.ts` arm is earned. The shape is the same armed or armless — an
 * armless module has only the `default:` case — so nothing here or
 * downstream changes when an arm is earned (ARMS.md).
 */
function scopedServices(
  scopeActor: ScopeActorTypes,
  _scopeContext?: ScopeContext
): Partial<OrdersServices> {
  switch (scopeActor) {
    // case ScopeActorTypes.CLIENT:
    //   return createOrdersServices(scopeContext);
    default:
      return {};
  }
}

/**
 * One services instance per scope — the ONE factory both `useOrders`
 * (the collection) and `useOrder` (the manager) consume, so the two
 * composables share one identity seam, one cache key and one arm-resolution
 * switch (`useClientReceivedEmails`/`useClientReceivedEmail` precedent).
 */
export const createOrdersServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): OrdersServices => {
  const { activeUser } = useActiveSession().useContext();

  return {
    queryKey,
    isAvailable: computed(() => isAddressable(activeUser.value?.id)),
    error: computed<ResponseError | undefined>(() => undefined),
    loadList,
    loadOne: id => loadOne(id),
    loadItemImages,
    loadOnlineGateways,
    ...scopedServices(scopeActor, scopeContext)
  };
};

export default createOrdersServices;
