import { watch } from "vue";
import { interpret } from "xstate";
import { dataManagerMachine } from "../data-manager";
import { createScopedComposable } from "../scope/scope.builder";
import { ScopeActorTypes } from "../scope/scope.types";
import { useI18n } from "../system-localisation";
import { isClientScopeActor } from "./affiliate.utils";
import { useAffiliateActiveAccount } from "./useAffiliateActiveAccount";
import { createAffiliateLinkManagerActions } from "./useAffiliateLinkManager.actions";
import { createAffiliateLinkManagerContext } from "./useAffiliateLinkManager.context";
import { createAffiliateLinkManagerInternals } from "./useAffiliateLinkManager.internals";
import { createAffiliateLinkManagerMachineConfig } from "./useAffiliateLinkManager.machine";
import { createAffiliateLinkManagerMeta } from "./useAffiliateLinkManager.meta";
import {
  createActor,
  contextMatches,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import type {
  AffiliateLinkManagerContext,
  AffiliateScopeMatrix
} from "./affiliate.types";
import type { ScopeConfig, ScopeKey } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateLinkManager
 * @description Scoped per-link form editor, backed by the shared
 * `dataManagerMachine` (design.md §8.4 Editors, §8.6). Addresses the link it
 * edits with `.withId(linkId)`, never `.for()` (design.md §5.2); a create
 * opens with `.fresh()` (D-22). Registered under the same module name as
 * `useAffiliateLinks`; the scope key carries the differentiation.
 */
function createAffiliateLinkManagerForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const { t } = useI18n();
  const actorScope = config.actor as ScopeActorTypes;
  const linkId = config.id;

  const resolver = useAffiliateActiveAccount().as(ScopeActorTypes.CLIENT);
  const resolverContext = resolver.useContext();

  const initialContext: AffiliateLinkManagerContext = {
    id: linkId,
    accountId: isClientScopeActor(actorScope)
      ? resolverContext.activeAccountId.value
      : undefined,
    allowMultipleEdits: true
  };

  const machineService = interpret(
    dataManagerMachine
      .withConfig(createAffiliateLinkManagerMachineConfig(actorScope))
      .withContext(initialContext),
    { id: scopeKey, devTools: false }
  );
  machineService.start();

  const actorRef = createActor(machineService);
  if (!actorRef) {
    throw new DetailedError(
      t("error.affiliate_link_not_available"),
      responseCodes.Service_Unavailable,
      ErrorOrigin.Headless,
      { scope: config }
    );
  }

  /**
   * Top-up ONLY, for the first defined `activeAccountId` — the wait and
   * top-up of design.md §8.4, Editors (D-42). `refreshContext` keeps an
   * already-present value, so this never clobbers a resolved pin.
   */
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

  const actions = createAffiliateLinkManagerActions(
    actorScope,
    actorRef,
    scopeKey
  );

  return {
    // --- Sub-composables
    useActions: () => actions,
    useContext: () => createAffiliateLinkManagerContext(actorScope, actorRef),
    useInternals: () =>
      createAffiliateLinkManagerInternals(actorScope, actorRef),
    useMeta: () => createAffiliateLinkManagerMeta(actorScope, actorRef)
  };
}

/**
 * Scoped composable for editing ONE referral link.
 *
 * @example
 * ```ts
 * const manager = useAffiliateLinkManager().as('client').withId(linkId);
 * const draft = useAffiliateLinkManager().as('client').fresh();
 * ```
 */
export const useAffiliateLinkManager = createScopedComposable<
  ReturnType<typeof createAffiliateLinkManagerForScope>,
  AffiliateScopeMatrix
>("affiliate-link-manager", createAffiliateLinkManagerForScope);

export type UseAffiliateLinkManager = ReturnType<
  typeof useAffiliateLinkManager
>;
