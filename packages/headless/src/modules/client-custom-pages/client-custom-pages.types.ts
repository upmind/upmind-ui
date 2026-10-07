/**
 * @graphify-citation `graphify query "ICustomPage custom page model brand_id"`
 * against `graphify-out/graph.json` (2026-09-09) returns `ICustomPage`
 * (`packages/types/src/models/customPage.ts`) as the only existing
 * custom-page construct — brand-owned (`brand_id`), no `client_id` anywhere on
 * it. No prior `ClientCustomPagesContextTypes`, `CustomPagesSortableProperties`
 * or `CustomPage` view-model exists in the tree, so the members below are new
 * ground, not a duplicate of something the graph already exposes. A second
 * query, `"useClientTemplate ClientTemplateSlotCodes"` (2026-09-09), confirms
 * `ClientTemplateSlotCodes.CUSTOM_PAGE` (`packages/types/src/data/enums/templates.ts:24`)
 * and `useClientTemplate` (`system-client-area/template-render/useClientTemplate.ts:18`)
 * already exist and are reused as-is (AC6) — this module mints no renderer.
 * See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module client-custom-pages/client-custom-pages.types
 * @description Types for the brand's client-area custom pages — the
 * query-backed collection (`useClientCustomPages`) and the query-backed
 * single read by slug (`useClientCustomPage`). The COLLECTION owns a context
 * enum and a matrix that resolves one cell, mirroring the landed portal
 * contract (D1, operator ruling 2026-09-09). The SINGLE READ owns NO context
 * enum — the slug is a record id (`.withId(slug)`), not a context — but it
 * still owns a matrix, an ALL-`never` one, because that is the only construct
 * that makes `.for()` unspellable. No mutation surface and no state machine:
 * the oracle wires zero mutations for this resource.
 */

// @graphify-citation `graphify query "getRegistry scope registry peek existing
// instance without minting"` (2026-09-10, graphify-out/graph.json) confirms
// `ComputedRef` is Vue's own existing type — no duplicate construct is minted
// by adding it below. See graphify-out/GRAPH_REPORT.md.
import { AccessRoleTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { ListQuery, SimpleQuery } from "../query";
import type { SortDirection } from "../query/query.types";
import type { JsonSchema7 } from "@jsonforms/core";
import type { QueryKey } from "@tanstack/vue-query";
import type { ICustomPage } from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// SCOPE — two matrices, one context enum
// -----------------------------------------------------------------------------

/**
 * Context types for the COLLECTION — the landed portal contract's own set
 * (`apps/portal-nuxt/app/portal/mock/contracts/client-custom-pages.ts:32-39`).
 * One member: reading the brand's pages as a signed-in client.
 */
export enum ClientCustomPagesContextTypes {
  CLIENT = AccessRoleTypes.CLIENT
}

/**
 * @decision
 * what:     The COLLECTION keeps its context cell, mirroring the landed
 *           portal contract. `client-custom-pages.types.ts` declares
 *           `ClientCustomPagesContextTypes` with its single member
 *           `CLIENT: AccessRoleTypes.CLIENT`, and
 *           `CLIENT_CUSTOM_PAGES_SCOPE_MATRIX` resolves
 *           `[ScopeActorTypes.CLIENT]: ClientCustomPagesContextTypes.CLIENT`;
 *           SELF, STAFF and GUEST stay `null as never`.
 *           The ITEM door is UNCHANGED: `CLIENT_CUSTOM_PAGE_SCOPE_MATRIX`
 *           stays four `null as never`, its TYPE passed as
 *           `createScopedComposable`'s `TMatrix`, its VALUE not passed as the
 *           runtime third argument, not barrel-exported.
 * why:      Operator ruling, 2026-09-09. The headless matrix mirrors the
 *           landed app-side contract at
 *           `apps/portal-nuxt/app/portal/mock/contracts/client-custom-pages.ts:32-39`
 *           and `:45-50`, so the two declarations of this collection's actor
 *           surface agree rather than diverging. The item door's all-`never`
 *           matrix is untouched because the ruling does not reach it: a
 *           record key is not a scope context (ADR-001:247-264; FE-3095,
 *           restated at `client-email-history.types.ts:104-118`).
 * rejected: The all-`never` COLLECTION matrix — the planner's recommendation,
 *           carried here verbatim so the next reader sees exactly what was
 *           weighed and lost, not a strawman:
 *           (i)   A matrix cell buys `.for(type, id)` and nothing else
 *                 (`client-email-history.types.ts:96-100`; `scope.builder.ts:240`
 *                 — "GUEST: Returns T, or T & { for } if matrix defines
 *                 contexts for guest"). `.for()` exists to RETARGET the
 *                 outbound URL at another entity.
 *           (ii)  There is nothing here to retarget. The oracle's list URL is
 *                 bare (`customPages/index.ts:49`); the single read appends
 *                 only a slug (`:39`); `ICustomPage` has NO client-owner
 *                 member at all (`packages/types/src/models/customPage.ts:5-15`)
 *                 — the row is brand-owned (`brand_id`, `:6`).
 *           (iii) The sibling's identical-looking cell IS backed by a real
 *                 seam — `client-email-history.services.ts:56-77`
 *                 (`resolveClientId`) puts the context id into the URL. This
 *                 module can build no such seam, because there is no id in
 *                 the URL to put it into.
 *           (iv)  Therefore the cell type-checks a retarget the wire cannot
 *                 perform: a cell that exists without behaviour, which is the
 *                 shape ADR-001:606 grades against ("Correctness of a scope
 *                 adoption is defined by the actor×context matrix BEHAVING
 *                 against the vue-app legacy — not by the matrix's mere
 *                 existence").
 *           (v)   Nothing forced the mirror on build grounds:
 *                 `contracts.typecheck.ts` contains ZERO `.for(` calls
 *                 anywhere in the file, and its `mintCollection` (`:168-178`)
 *                 is a mock minter (`defineMockCollection(...).resolve(dataset)`)
 *                 that never reaches `createScopedComposable`; the contract
 *                 imports only TYPES from headless. Dropping the cell would
 *                 have broken no landed build.
 *           Also rejected, independently of the ruling: (b) minting a
 *           `BRAND` context so `.for('brand', id)` could read another
 *           brand's pages — no oracle capability; the oracle resolves the
 *           brand from the request Origin, never a parameter. (c) A
 *           resolving `[GUEST]` cell — settled by the R1 ruling.
 * consequence: THE CELL DOES NOT WORK, AND THE BUNDLE MUST NOT IMPLY IT DOES.
 *           `.as('client').for('client', id)` now type-checks and DOES NOT
 *           retarget the request: the outbound URL is `api/custom_pages`
 *           regardless of the id supplied. The cell exists to mirror the
 *           contract, not to deliver a capability. This is recorded on the
 *           `client × on-behalf-of-client` row of `parity.yaml` and is a
 *           MANDATORY `gotchas.md` entry for the documenter (tasks.md T12).
 *           No AC asserts the retarget, and none may be added that does.
 */
export const CLIENT_CUSTOM_PAGES_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: ClientCustomPagesContextTypes.CLIENT,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useClientCustomPages` (derived from the runtime const). */
export type ClientCustomPagesScopeMatrix =
  typeof CLIENT_CUSTOM_PAGES_SCOPE_MATRIX;

/**
 * Scope matrix for `useClientCustomPage` — the SINGLE read. Every actor is
 * `null as never`, so `.for(type, id)` is a compile-time error for all four.
 * The slug is marked with `.withId(slug)` and is never a scope context
 * (`templates/SINGLE-READ.md`) — unaffected by the D1 ruling above, which
 * reaches only the collection.
 *
 * Its TYPE is passed as `createScopedComposable`'s `TMatrix`; the VALUE is
 * not passed as the third (runtime) argument, so no matrix reaches the
 * registry for this read. Dropping the type argument is what re-opens
 * `.for()`, so it is not optional paperwork. Not re-exported from the module
 * barrel: it names no context a consumer can spell.
 */
export const CLIENT_CUSTOM_PAGE_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useClientCustomPage` (derived from the runtime const). */
export type ClientCustomPageScopeMatrix =
  typeof CLIENT_CUSTOM_PAGE_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/** Wire columns the custom-page list can be sorted by. */
export enum CustomPagesSortableProperties {
  DEFAULT = "created_at",
  NAME = "name"
}

// -----------------------------------------------------------------------------
// QUERY MODEL
// -----------------------------------------------------------------------------

/**
 * The whole request state as one model — `filters`, `sort` and `pagination`.
 * This is the instance validated against `useQuerySchema()`. No `default` on
 * `sort` (design.md D4/parity O6/O33): the oracle issues the list
 * unparameterised — inserted order, no `order` param — so the boot model
 * carries no sort entry either, or the very first read would send one the
 * oracle never does.
 */
export type CustomPagesQueryModel = {
  filters?: {
    show_on_menu?: { eq?: boolean };
    slug?: { eq?: string };
  };
  sort?: CustomPagesSortEntry[];
  pagination?: { limit?: number; offset?: number };
};

/** The nested filter model — the `filters` branch of {@link CustomPagesQueryModel}. */
export type CustomPagesFilterModel = NonNullable<
  CustomPagesQueryModel["filters"]
>;

/** One sort entry — the MODEL's ordered form; precedence is position. */
export type CustomPagesSortEntry = {
  field: CustomPagesSortableProperties;
  dir: SortDirection;
};

/** The ordered sort model — the `sort` branch of {@link CustomPagesQueryModel}. */
export type CustomPagesSortModel = NonNullable<CustomPagesQueryModel["sort"]>;

/**
 * The collection's query schema. A `JsonSchema7`: a query schema IS a real
 * Draft-07 schema, walked at runtime by the translator/validators, so the
 * type stays general rather than a module-specific literal.
 */
export type CustomPagesQuerySchema = JsonSchema7;

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * One custom page, mapped from the wire `ICustomPage`. `title` / `menuLabel`
 * carry the `*_translated || *` fallback (AC7) resolved in the mapper, so no
 * consumer repeats it.
 */
export type CustomPage = {
  id: ICustomPage["id"];
  brandId: ICustomPage["brand_id"];
  name: ICustomPage["name"];
  slug: ICustomPage["slug"];
  title: ICustomPage["title"];
  menuLabel: ICustomPage["menu_label"];
  showOnMenu: ICustomPage["show_on_menu"];
};

/**
 * The collection's named filters — an absent value clears that key. Mirrors
 * the landed portal contract's `ClientCustomPagesFilters`
 * (`apps/portal-nuxt/app/portal/mock/contracts/client-custom-pages.ts:74-79`).
 */
export type CustomPagesFilters = {
  /** Narrows to the pages the nav injects. */
  showOnMenu: (value?: CustomPage["showOnMenu"]) => void;
  /** Narrows to one page by its route slug. */
  slug: (value?: CustomPage["slug"]) => void;
};

// -----------------------------------------------------------------------------
// SERVICE-LAYER SHAPES
// -----------------------------------------------------------------------------

/**
 * The reactive list query, minted ONCE per scope in `useClientCustomPages.ts`.
 * Aliased from the query platform's own `ListQuery` — NEVER derived with
 * `ReturnType<typeof localServiceFn>` (`ListQuery`'s own docblock bans this).
 */
export type CustomPagesListQuery = ListQuery<
  ICustomPage[],
  CustomPage[],
  CustomPagesQueryModel
>;

/**
 * The reactive single-item query, minted ONCE per scope in
 * `useClientCustomPage.ts`. Aliases the platform's own `SimpleQuery`, never
 * from `ReturnType<typeof loadOne>`.
 */
export type CustomPageQuery = SimpleQuery<ICustomPage, CustomPage>;

/**
 * The contract `createClientCustomPagesServices` resolves to — consumed by
 * BOTH doors, so the collection and the single read address the same
 * endpoint family through the same seam. No `clientId` / `isAvailable`
 * member: unlike `client-email-history`, this resource is brand-scoped and
 * needs no addressability predicate (D1 `consequence:`; AC9).
 */
export type ClientCustomPagesServices = {
  /** The module's base cache key. */
  queryKey: QueryKey;
  /**
   * The collection's list handle. Takes NOTHING: the request state is the
   * declared query schema, handed to `list({ criteria })`.
   */
  loadList: () => CustomPagesListQuery;
  /**
   * One page by its slug. `listRow`, when given, is the SAME row already
   * resolved from an already-mounted collection instance
   * (`useClientCustomPage.ts`'s registry peek) and gates the request
   * (O9/O10 — see graphify-out/ citation above): its presence means no
   * fetch is issued at all; its absence changes nothing (AC4).
   */
  loadOne: (
    slug?: CustomPage["slug"],
    listRow?: ComputedRef<CustomPage | undefined>
  ) => CustomPageQuery;
};
