import { computed, ref, watch } from "vue";
import { createScopedComposable } from "../scope";
import { ScopeActorTypes } from "../scope/scope.types";
import { loadAffiliatePayoutsList } from "./affiliate.services";
import { AFFILIATE_DEFAULT_SORT } from "./affiliate.types";
import {
  accountBoundPlaceholderData,
  isClientScopeActor
} from "./affiliate.utils";
import { useAffiliateActiveAccount } from "./useAffiliateActiveAccount";
import { createAffiliatePayoutsActions } from "./useAffiliatePayouts.actions";
import { createAffiliatePayoutsContext } from "./useAffiliatePayouts.context";
import { createAffiliatePayoutsInternals } from "./useAffiliatePayouts.internals";
import { createAffiliatePayoutsMeta } from "./useAffiliatePayouts.meta";
import type { AffiliateScopeMatrix } from "./affiliate.types";
import type { ScopeConfig, ScopeKey } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliatePayouts
 * @description The client's own payout history — a criteria-driven collection
 * over the active account (design.md §8.1, §8.3, §8.4, D-34). Rows are mapped
 * through `mapAffiliatePayout` (`affiliate.mappers.ts`).
 *
 * @decision this factory's return type carries no exported type alias, and
 * neither do its four layer files.
 * what: no `Use*Context`/`Meta`/`Actions`/`Internals` type export from this
 *      composable or its layer files, unlike this codebase's usual
 *      "type export for consumers" convention.
 * why: `apps/portal-nuxt/app/portal/mock/contracts/client-affiliate.ts`
 *      already exports `UseAffiliatePayoutsContext` and its `Meta`/`Actions`/`Internals`
 *      siblings; the duplicate-type gate denies a second declaration.
 * rejected: renaming the export — would break the "type export for
 *      consumers" convention for this composable alone (same reasoning
 *      as `useClientAffiliate.context.ts`'s own header decision).
 */
// -----------------------------------------------------------------------------

const PAYOUTS_DEFAULT_LIMIT = 10;

function createAffiliatePayoutsForScope(
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

  const query = loadAffiliatePayoutsList(
    keyAccountId,
    accountBoundPlaceholderData(keyAccountId)
  );

  function resetCriteria(): void {
    query.setCriteria({
      filters: {},
      sort: AFFILIATE_DEFAULT_SORT,
      pagination: { limit: PAYOUTS_DEFAULT_LIMIT, offset: 0 }
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

  const actions = createAffiliatePayoutsActions(
    actorScope,
    query,
    keyAccountId,
    scopeKey
  );

  return {
    // --- sub-composables
    useActions: () => actions,
    useContext: () => createAffiliatePayoutsContext(actorScope, query),
    useInternals: () => createAffiliatePayoutsInternals(actorScope, query),
    useMeta: () => createAffiliatePayoutsMeta(actorScope, query, keyAccountId)
  };
}

/**
 * The client's own payout history.
 *
 * @example
 * ```ts
 * const payouts = useAffiliatePayouts().as('client');
 * await payouts.useActions().isReady();
 * const { data } = payouts.useContext();
 * ```
 */
export const useAffiliatePayouts = createScopedComposable<
  ReturnType<typeof createAffiliatePayoutsForScope>,
  AffiliateScopeMatrix
>("affiliate-payouts", createAffiliatePayoutsForScope);
