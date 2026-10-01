import { computed, ref, watch } from "vue";
import { createScopedComposable } from "../scope";
import { ScopeActorTypes } from "../scope/scope.types";
import { loadAffiliateCommissionsList } from "./affiliate.services";
import { AFFILIATE_DEFAULT_SORT } from "./affiliate.types";
import {
  accountBoundPlaceholderData,
  isClientScopeActor
} from "./affiliate.utils";
import { useAffiliateActiveAccount } from "./useAffiliateActiveAccount";
import { createAffiliateCommissionsActions } from "./useAffiliateCommissions.actions";
import { createAffiliateCommissionsContext } from "./useAffiliateCommissions.context";
import { createAffiliateCommissionsInternals } from "./useAffiliateCommissions.internals";
import { createAffiliateCommissionsMeta } from "./useAffiliateCommissions.meta";
import type { AffiliateScopeMatrix } from "./affiliate.types";
import type { ScopeConfig, ScopeKey } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateCommissions
 * @description The client's own pending-commission history — a criteria-driven
 * collection over the active account (design.md §8.1, §8.3, §8.4).
 *
 * @decision this factory's return type carries no exported type alias, and
 * neither do its four layer files.
 * what: no `Use*Context`/`Meta`/`Actions`/`Internals` type export from this
 *      composable or its layer files, unlike this codebase's usual
 *      "type export for consumers" convention.
 * why: `apps/portal-nuxt/app/portal/mock/contracts/client-affiliate.ts`
 *      already exports `UseAffiliateCommissionsContext` and its `Meta`/`Actions`/`Internals`
 *      siblings; the duplicate-type gate denies a second declaration.
 * rejected: renaming the export — would break the "type export for
 *      consumers" convention for this composable alone (same reasoning
 *      as `useClientAffiliate.context.ts`'s own header decision).
 */
// -----------------------------------------------------------------------------

const COMMISSIONS_DEFAULT_LIMIT = 10;

function createAffiliateCommissionsForScope(
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

  const query = loadAffiliateCommissionsList(
    keyAccountId,
    accountBoundPlaceholderData(keyAccountId)
  );

  function resetCriteria(): void {
    query.setCriteria({
      filters: {},
      sort: AFFILIATE_DEFAULT_SORT,
      pagination: { limit: COMMISSIONS_DEFAULT_LIMIT, offset: 0 }
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

  const actions = createAffiliateCommissionsActions(
    actorScope,
    query,
    keyAccountId,
    scopeKey
  );

  return {
    // --- sub-composables
    useActions: () => actions,
    useContext: () => createAffiliateCommissionsContext(actorScope, query),
    useInternals: () => createAffiliateCommissionsInternals(actorScope, query),
    useMeta: () =>
      createAffiliateCommissionsMeta(actorScope, query, keyAccountId)
  };
}

/**
 * The client's own pending-commission history.
 *
 * @example
 * ```ts
 * const commissions = useAffiliateCommissions().as('client');
 * await commissions.useActions().isReady();
 * const { data } = commissions.useContext();
 * ```
 */
export const useAffiliateCommissions = createScopedComposable<
  ReturnType<typeof createAffiliateCommissionsForScope>,
  AffiliateScopeMatrix
>("affiliate-commissions", createAffiliateCommissionsForScope);
