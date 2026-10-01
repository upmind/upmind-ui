import { computed, ref, watch } from "vue";
import { createScopedComposable } from "../scope";
import { ScopeActorTypes } from "../scope/scope.types";
import { loadAffiliateReferralsList } from "./affiliate.services";
import { AFFILIATE_DEFAULT_SORT } from "./affiliate.types";
import {
  accountBoundPlaceholderData,
  isClientScopeActor
} from "./affiliate.utils";
import { useAffiliateActiveAccount } from "./useAffiliateActiveAccount";
import { createAffiliateReferralsActions } from "./useAffiliateReferrals.actions";
import { createAffiliateReferralsContext } from "./useAffiliateReferrals.context";
import { createAffiliateReferralsInternals } from "./useAffiliateReferrals.internals";
import { createAffiliateReferralsMeta } from "./useAffiliateReferrals.meta";
import type { AffiliateScopeMatrix } from "./affiliate.types";
import type { ScopeConfig, ScopeKey } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateReferrals
 * @description The client's own referral history — a criteria-driven
 * collection over the active account (design.md §8.1, §8.3, §8.4). Its dotted
 * `affiliate_link.*` filter keys stay literal schema keys (§8.9).
 *
 * @decision this factory's return type carries no exported type alias, and
 * neither do its four layer files.
 * what: no `Use*Context`/`Meta`/`Actions`/`Internals` type export from this
 *      composable or its layer files, unlike this codebase's usual
 *      "type export for consumers" convention.
 * why: `apps/portal-nuxt/app/portal/mock/contracts/client-affiliate.ts`
 *      already exports `UseAffiliateReferralsContext` and its `Meta`/`Actions`/`Internals`
 *      siblings; the duplicate-type gate denies a second declaration.
 * rejected: renaming the export — would break the "type export for
 *      consumers" convention for this composable alone (same reasoning
 *      as `useClientAffiliate.context.ts`'s own header decision).
 */
// -----------------------------------------------------------------------------

const REFERRALS_DEFAULT_LIMIT = 5;

function createAffiliateReferralsForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const actorScope = config.actor as ScopeActorTypes;
  const isClientActor = computed(() => isClientScopeActor(actorScope));

  const resolver = useAffiliateActiveAccount().as(ScopeActorTypes.CLIENT);
  const resolverContext = resolver.useContext();

  const activeAccountId = computed(() =>
    isClientActor.value ? resolverContext.activeAccountId.value : undefined
  );

  const keyAccountId = ref<string | undefined>(undefined);
  const lastKeyedAccountId = ref<string | undefined>(undefined);

  const query = loadAffiliateReferralsList(
    keyAccountId,
    accountBoundPlaceholderData(keyAccountId)
  );

  function resetCriteria(): void {
    query.setCriteria({
      filters: {},
      sort: AFFILIATE_DEFAULT_SORT,
      pagination: { limit: REFERRALS_DEFAULT_LIMIT, offset: 0 }
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

  const actions = createAffiliateReferralsActions(
    actorScope,
    query,
    keyAccountId,
    scopeKey
  );

  return {
    // --- sub-composables
    useActions: () => actions,
    useContext: () => createAffiliateReferralsContext(actorScope, query),
    useInternals: () => createAffiliateReferralsInternals(actorScope, query),
    useMeta: () => createAffiliateReferralsMeta(actorScope, query, keyAccountId)
  };
}

/**
 * The client's own referral history.
 *
 * @example
 * ```ts
 * const referrals = useAffiliateReferrals().as('client');
 * await referrals.useActions().isReady();
 * const { data } = referrals.useContext();
 * ```
 */
export const useAffiliateReferrals = createScopedComposable<
  ReturnType<typeof createAffiliateReferralsForScope>,
  AffiliateScopeMatrix
>("affiliate-referrals", createAffiliateReferralsForScope);
