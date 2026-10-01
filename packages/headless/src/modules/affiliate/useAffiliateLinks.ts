import { computed, ref, watch } from "vue";
import { createScopedComposable } from "../scope";
import { ScopeActorTypes } from "../scope/scope.types";
import {
  loadAffiliateLinksList,
  removeAffiliateLink
} from "./affiliate.services";
import { AFFILIATE_DEFAULT_SORT } from "./affiliate.types";
import {
  accountBoundPlaceholderData,
  isClientScopeActor
} from "./affiliate.utils";
import { useAffiliateActiveAccount } from "./useAffiliateActiveAccount";
import { createAffiliateLinksActions } from "./useAffiliateLinks.actions";
import { createAffiliateLinksContext } from "./useAffiliateLinks.context";
import { createAffiliateLinksInternals } from "./useAffiliateLinks.internals";
import { createAffiliateLinksMeta } from "./useAffiliateLinks.meta";
import type { AffiliateScopeMatrix } from "./affiliate.types";
import type { ResponseError } from "../../utils";
import type { ScopeConfig, ScopeKey } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateLinks
 * @description The client's own referral links — a criteria-driven collection
 * over the active account (design.md §8.1, §8.3, §8.4). Follows `useClientAddresses`
 * (§4).
 *
 * @decision this factory's return type carries no exported type alias, and
 * neither do its four layer files.
 * what: no `Use*Context`/`Meta`/`Actions`/`Internals` type export from this
 *      composable or its layer files, unlike this codebase's usual
 *      "type export for consumers" convention.
 * why: `apps/portal-nuxt/app/portal/mock/contracts/client-affiliate.ts`
 *      already exports `UseAffiliateLinksContext` and its `Meta`/`Actions`/`Internals`
 *      siblings; the duplicate-type gate denies a second declaration.
 * rejected: renaming the export — would break the "type export for
 *      consumers" convention for this composable alone (same reasoning
 *      as `useClientAffiliate.context.ts`'s own header decision).
 */
// -----------------------------------------------------------------------------

const LINKS_DEFAULT_LIMIT = 10;

function createAffiliateLinksForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;
  const isClientActor = computed(() => isClientScopeActor(actorScope));

  const resolver = useAffiliateActiveAccount().as(ScopeActorTypes.CLIENT);
  const resolverContext = resolver.useContext();

  const activeAccountId = computed(() =>
    isClientActor.value ? resolverContext.activeAccountId.value : undefined
  );

  /** This collection's OWN account key — never `activeAccountId` directly (design.md §8.4). */
  const keyAccountId = ref<string | undefined>(undefined);
  const lastKeyedAccountId = ref<string | undefined>(undefined);

  /** The last refused `remove()` — read, never raised (design.md §8.2 Failure surface). */
  const writeError = ref<ResponseError | undefined>(undefined);

  const query = loadAffiliateLinksList(
    keyAccountId,
    accountBoundPlaceholderData(keyAccountId)
  );

  function resetCriteria(): void {
    query.setCriteria({
      filters: {},
      sort: AFFILIATE_DEFAULT_SORT,
      pagination: { limit: LINKS_DEFAULT_LIMIT, offset: 0 }
    });
  }

  watch(
    activeAccountId,
    next => {
      if (next === undefined) {
        keyAccountId.value = undefined;
        return;
      }
      if (
        lastKeyedAccountId.value !== undefined &&
        next !== lastKeyedAccountId.value
      ) {
        resetCriteria();
      }
      keyAccountId.value = next;
      lastKeyedAccountId.value = next;
    },
    { flush: "sync", immediate: true }
  );

  const actions = createAffiliateLinksActions(
    actorScope,
    query,
    keyAccountId,
    removeAffiliateLink,
    scopeKey,
    writeError
  );

  return {
    // --- sub-composables
    useActions: () => actions,
    useContext: () =>
      createAffiliateLinksContext(actorScope, query, writeError),
    useInternals: () => createAffiliateLinksInternals(actorScope, query),
    useMeta: () =>
      createAffiliateLinksMeta(actorScope, query, keyAccountId, writeError)
  };
}

/**
 * The client's own referral links.
 *
 * @example
 * ```ts
 * const links = useAffiliateLinks().as('client');
 * await links.useActions().isReady();
 * const { data } = links.useContext();
 * ```
 */
export const useAffiliateLinks = createScopedComposable<
  ReturnType<typeof createAffiliateLinksForScope>,
  AffiliateScopeMatrix
>("affiliate-links", createAffiliateLinksForScope);
