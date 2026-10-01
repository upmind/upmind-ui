import { watch } from "vue";
import { interpret } from "xstate";
import { dataManagerMachine } from "../data-manager";
import { createScopedComposable } from "../scope/scope.builder";
import { ScopeActorTypes } from "../scope/scope.types";
import { useI18n } from "../system-localisation";
import { isClientScopeActor } from "./affiliate.utils";
import { useAffiliateActiveAccount } from "./useAffiliateActiveAccount";
import { createAffiliatePayoutDestinationManagerActions } from "./useAffiliatePayoutDestinationManager.actions";
import { createAffiliatePayoutDestinationManagerContext } from "./useAffiliatePayoutDestinationManager.context";
import { createAffiliatePayoutDestinationManagerInternals } from "./useAffiliatePayoutDestinationManager.internals";
import { createAffiliatePayoutDestinationManagerMachineConfig } from "./useAffiliatePayoutDestinationManager.machine";
import { createAffiliatePayoutDestinationManagerMeta } from "./useAffiliatePayoutDestinationManager.meta";
import {
  createActor,
  contextMatches,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import type {
  AffiliatePayoutDestinationManagerContext,
  AffiliateScopeMatrix
} from "./affiliate.types";
import type { ScopeConfig, ScopeKey } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliatePayoutDestinationManager
 * @description Scoped payout-destination form editor, backed by the shared
 * `dataManagerMachine` (design.md §8.4 Editors, §8.6, D-40). Each open is
 * `.as(CLIENT).fresh()` (design.md §8.4, Editor doors).
 */
function createAffiliatePayoutDestinationManagerForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const { t } = useI18n();
  const actorScope = config.actor as ScopeActorTypes;

  const resolver = useAffiliateActiveAccount().as(ScopeActorTypes.CLIENT);
  const resolverContext = resolver.useContext();

  const initialContext: AffiliatePayoutDestinationManagerContext = {
    accountId: isClientScopeActor(actorScope)
      ? resolverContext.activeAccountId.value
      : undefined,
    allowMultipleEdits: true
  };

  const machineService = interpret(
    dataManagerMachine
      .withConfig(
        createAffiliatePayoutDestinationManagerMachineConfig(actorScope)
      )
      .withContext(initialContext),
    { id: scopeKey, devTools: false }
  );
  machineService.start();

  const actorRef = createActor(machineService);
  if (!actorRef) {
    throw new DetailedError(
      t("error.affiliate_payout_destination_not_available"),
      responseCodes.Service_Unavailable,
      ErrorOrigin.Headless,
      { scope: config }
    );
  }

  const stopTopUp = watch(resolverContext.activeAccountId, next => {
    if (
      !isClientScopeActor(actorScope) ||
      !next ||
      contextMatches(actorRef.state, "accountId")
    )
      return;
    stopTopUp();
    actorRef.send({ type: "REFRESH", data: { accountId: next } });
  });

  const actions = createAffiliatePayoutDestinationManagerActions(
    actorScope,
    actorRef,
    scopeKey
  );

  return {
    // --- Sub-composables
    useActions: () => actions,
    useContext: () =>
      createAffiliatePayoutDestinationManagerContext(actorScope, actorRef),
    useInternals: () =>
      createAffiliatePayoutDestinationManagerInternals(actorScope, actorRef),
    useMeta: () =>
      createAffiliatePayoutDestinationManagerMeta(actorScope, actorRef)
  };
}

/**
 * Scoped composable for editing the client's payout destination.
 *
 * @example
 * ```ts
 * const manager = useAffiliatePayoutDestinationManager().as('client').fresh();
 * await manager.useActions().isReady();
 * ```
 */
export const useAffiliatePayoutDestinationManager = createScopedComposable<
  ReturnType<typeof createAffiliatePayoutDestinationManagerForScope>,
  AffiliateScopeMatrix
>(
  "affiliate-payout-destination-manager",
  createAffiliatePayoutDestinationManagerForScope
);

export type UseAffiliatePayoutDestinationManager = ReturnType<
  typeof useAffiliatePayoutDestinationManager
>;
