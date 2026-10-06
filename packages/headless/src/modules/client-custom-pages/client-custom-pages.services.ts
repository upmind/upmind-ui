/** @internal */
// -----------------------------------------------------------------------------
import { useQuery } from "../query";
import { mapCustomPage, mapCustomPages } from "./client-custom-pages.mappers";
import { useQuerySchema } from "./client-custom-pages.schemas";
import type {
  ClientCustomPagesServices,
  CustomPage,
  CustomPageQuery,
  CustomPagesListQuery
} from "./client-custom-pages.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { ICustomPage } from "@upmind-automation/types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-pages/client-custom-pages.services
 * @description The ONE services file both doors consume — the collection's
 * `loadList` and the single read's `loadOne`. No arms (`parity.yaml`
 * `arms.services: none`): every in-scope actor hits the same endpoint family,
 * and `.for('client', id)` on the collection has no wire seam to reach (D1
 * `consequence:`) — neither function accepts a scope context.
 *
 * Nothing here raises feedback. A failure rejects for the caller and lands in
 * the scope's own error state, which the composables expose.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useClientCustomPages.ts` / `useClientCustomPage.ts` only.
 */
// -----------------------------------------------------------------------------

/** The module's base cache key. */
export const queryKey: QueryKey = ["client", "customPages"];

/**
 * @decision
 * what:     The LIST omits `withAccessToken` entirely. The single read sends
 *           `withAccessToken: true`.
 * why:      Parity, precisely read. The oracle's LIST explicitly opts out
 *           (`customPages/index.ts:51`, `callConfig: { withAccessToken: false
 *           }`) because it runs at boot before any session exists
 *           (`main.ts:85-91`). The oracle's GET does NOT opt out — it takes
 *           the generic `data/fetch` default (`customPages/index.ts:30-44`;
 *           the generic action at `data/index.ts:135-172` attaches the
 *           session's credentials), and its only consumer is a signed-in
 *           client-area route (`views/client/custom/index.vue`). Reproducing
 *           the asymmetry IS the parity; flattening it in either direction is
 *           a change of behaviour. A token-bearing read on a public resource
 *           costs nothing and keeps the door open for a per-page permission
 *           the wire may later apply.
 * rejected: (a) Token-free single read, "for symmetry with the list".
 *           Rejected: symmetry is not the oracle. (b) Token-bearing list,
 *           "because we have a session by then". Rejected: it breaks AC9 and
 *           the boot-order capability the operator ruled in.
 */
function loadList(): CustomPagesListQuery {
  const { list, useUrl } = useQuery();

  return list<ICustomPage[], CustomPage[]>({
    criteria: { schema: useQuerySchema() },
    queryKey,
    url: useUrl("custom_pages"),
    select: mapCustomPages
  });
}

/**
 * SINGLE-RECORD READ — one page by its slug, minted once per scope by
 * `useClientCustomPage.ts`. The `slug` is the scope builder's own
 * `.withId(slug)`, relayed off `config.id` — NOT a scope context, and never
 * re-derived from one (`templates/SINGLE-READ.md`).
 *
 * An absent slug issues NO request: `enabled` gates on its presence, so the
 * un-addressed state never fetches `.../undefined`.
 *
 * @decision
 * what:     `listRow`, when it resolves a row, ALSO disables `enabled` — a
 *           slug already on an already-mounted collection issues NO request
 *           at all (O9/O10, oracle `customPageProvider.vue:90`).
 * why:      `enabled` is the query platform's own "skip the fetch entirely"
 *           gate — nothing is attempted, as opposed to `guard`, which runs
 *           INSIDE the fetch and surfaces a captured error. O9's short-
 *           circuit is a success path, not a failure, so `guard` is the
 *           wrong seam for it.
 * rejected: (a) Mint a second list query here to check the slug. Rejected —
 *           it would fetch the WHOLE collection to answer one slug's guard,
 *           the opposite of "no request at all". (b) Re-derive `list()`'s
 *           reactive query key here and peek `queryClient` for it directly.
 *           Rejected — that key is criteria-dependent (every filter/sort
 *           combination is its own cache entry, `query/docs/README.md`), so
 *           reconstructing it a second time risks silently drifting from
 *           `list()`'s own construction; `useClientCustomPage.ts` resolves
 *           `listRow` from an existing collection INSTANCE's own reactive
 *           `data` instead, which can never disagree with what that
 *           instance is actually showing.
 */
function loadOne(
  slug?: CustomPage["slug"],
  listRow?: ComputedRef<CustomPage | undefined>
): CustomPageQuery {
  const { query, useUrl } = useQuery();

  return query<ICustomPage, CustomPage>({
    queryKey: [...queryKey, "slug", slug],
    url: useUrl(`custom_pages/${slug}`),
    withAccessToken: true,
    select: mapCustomPage,
    enabled: () => !!slug && !listRow?.value
  });
}

/**
 * Services factory — `scopeActor` arrives for shape consistency with the
 * other layers and for a future arm to switch on without a call-site change
 * (`arms.services: none` today). No `scopeContext` parameter exists at all:
 * D1's `consequence:` (`client-custom-pages.types.ts`) bans reading a scope
 * context to build a URL, so it is never even accepted here.
 */
export const createClientCustomPagesServices = (
  _scopeActor: ScopeActorTypes
): ClientCustomPagesServices => ({
  queryKey,
  loadList,
  loadOne
});

export default createClientCustomPagesServices;
