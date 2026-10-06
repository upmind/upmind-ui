import { computed } from "vue";
import {
  createScopedComposable,
  generateScopeKey,
  getRegistry
} from "../scope";
import createClientCustomPagesServices from "./client-custom-pages.services";
import { createClientCustomPageActions } from "./useClientCustomPage.actions";
import { createClientCustomPageContext } from "./useClientCustomPage.context";
import { createClientCustomPageInternals } from "./useClientCustomPage.internals";
import { createClientCustomPageMeta } from "./useClientCustomPage.meta";
import { useCollection } from "../../utils";
import type {
  ClientCustomPageScopeMatrix,
  CustomPage
} from "./client-custom-pages.types";
import type { UseClientCustomPagesContext } from "./useClientCustomPages.context";
import type { ScopeActorTypes } from "../scope";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-pages/useClientCustomPage
 * @description Scoped, query-backed read of ONE of the brand's client-area
 * custom pages, resolved by its route slug: one TanStack item query per
 * concrete `(actor, id)` scope, minted once at construction. Its sibling is
 * `useClientCustomPages`, registered under the SAME module name; the
 * composable name and the scope key carry the differentiation.
 *
 * The slug being read is a RECORD ID (`.withId(slug)`), never a scope
 * context: there is no actor-context cell to declare, so the matrix this
 * passes as its `TMatrix` refuses every actor. That is not paperwork — the
 * default `ActorContextMatrix` widens every context to `string`, so omitting
 * the type argument would leave `.for("page", slug)` type-checking
 * (`templates/SINGLE-READ.md`, the FE-3095 receipt).
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */

/**
 * Resolves the SAME row from an already-mounted `useClientCustomPages`
 * collection instance, for O9/O10/O11 — the ONE seam `loadOne`'s guard,
 * `useClientCustomPage.context.ts`'s fallback, `.meta.ts`'s flags and
 * `.actions.ts`'s `isReady()` all read, so the four layers can never
 * disagree about whether this slug is already on the list.
 *
 * @decision
 * what:     Peeks the scope REGISTRY (`getRegistry()`, `../scope`) for a
 *           collection instance keyed under the SAME actor, with no
 *           `.for()` / `.inBrand()` / `.fresh()` — the default collection
 *           scope a consuming page mounts (`useClientCustomPages().as(actor)`).
 *           A registry MISS resolves to `undefined` forever for this scope,
 *           never re-checked.
 * why:      `getRegistry()` is a read-only lookup that mints nothing — the
 *           only alternative reachable from this module, `ensure()` (via
 *           calling `useClientCustomPages()` itself), MINTS an instance when
 *           absent, which would eagerly fetch the WHOLE collection just to
 *           open one page, exactly the request O9 exists to avoid, and
 *           would make the item door depend on the collection having been
 *           mounted — forbidden by this story. A scope with no mounted
 *           collection at construction time degrades to a plain fetch,
 *           unchanged from before this story.
 * rejected: (a) Consult ANY collection instance in the registry regardless
 *           of actor. Rejected — the wire itself is not actor-scoped (D1
 *           `consequence:`), but narrowing to the SAME actor keeps the peek
 *           to the pairing a consuming page actually mounts, rather than a
 *           same-session, different-actor collection (e.g. a staff panel)
 *           silently short-circuiting an unrelated client-facing read.
 *           (b) Re-check the registry on every reactive evaluation instead
 *           of once at construction. Rejected — the registry is a plain
 *           `Map`, not a Vue ref; a collection that mounts LATER in this
 *           scope's lifetime is a race this composable does not try to win,
 *           matching the oracle's own `created()`-time-only guard check
 *           (`customPageProvider.vue:72-75,90`).
 */
function findMountedListRow(
  actorScope: ScopeActorTypes,
  slug?: string
): ComputedRef<CustomPage | undefined> {
  const collectionKey = generateScopeKey("client-custom-pages", {
    actor: actorScope
  });
  const entry = getRegistry().get(collectionKey);
  const collectionData = entry
    ? (
        entry.instance as { useContext: () => UseClientCustomPagesContext }
      ).useContext().data
    : undefined;

  return computed<CustomPage | undefined>(() =>
    collectionData && slug
      ? useCollection<CustomPage>(collectionData).findOne({ slug })
      : undefined
  );
}

function createClientCustomPageForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const actorScope = config.actor as ScopeActorTypes;

  // ONE services instance for this scope — the SAME factory the collection
  // calls, so the two doors can never disagree about the endpoint family.
  const service = createClientCustomPagesServices(actorScope);

  // This slug's row, if an already-mounted collection already carries it
  // (O9/O10/O11) — fed to the guard below and to context/meta/actions.
  const listRow = findMountedListRow(actorScope, config.id);

  // Mint the item query ONCE per scope. `config.id` is the builder's own
  // `.withId(slug)`, already folded into the scope key — never re-derived
  // from `config.context`.
  const query = service.loadOne(config.id, listRow);

  const actions = createClientCustomPageActions(
    actorScope,
    service,
    query,
    scopeKey,
    listRow
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for single-read actions (lifecycle). */
    useActions: () => actions,

    /** Sub-composable for single-read context (the resolved page + error). */
    useContext: () => createClientCustomPageContext(actorScope, query, listRow),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createClientCustomPageInternals(actorScope, query),

    /** Sub-composable for single-read meta (state flags). */
    useMeta: () => createClientCustomPageMeta(actorScope, query, listRow)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for one of the brand's client-area custom pages, read in
 * full by its slug.
 *
 * The actor defaults to SELF, so `.as()` is optional.
 *
 * @example
 * ```ts
 * const page = useClientCustomPage().withId(slug)
 * const { data } = page.useContext()
 * await page.useActions().isReady()
 * ```
 */
// TWO type arguments, and no third RUNTIME argument. Dropping the second
// falls back to the wide `ActorContextMatrix` default and re-opens `.for()`.
export const useClientCustomPage = createScopedComposable<
  ReturnType<typeof createClientCustomPageForScope>,
  ClientCustomPageScopeMatrix
>("client-custom-pages", createClientCustomPageForScope);

// Type export for consumers
export type UseClientCustomPage = ReturnType<typeof useClientCustomPage>;
