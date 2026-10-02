import { interpret } from "xstate";
import { createScopedComposable } from "../scope/scope.builder";
import { useI18n } from "../system-localisation";
import contractMachine from "./contract.machine";
import { createContractActions } from "./useContract.actions";
import { createContractContext } from "./useContract.context";
import { createContractInternals } from "./useContract.internals";
import { createContractMeta } from "./useContract.meta";
import {
  createActor,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import type { ContractScopeMatrix } from "./contract.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module contract/useContract
 * @description Scoped manager for ONE contract, backed by the module's own
 * `contract.machine.ts`. One interpreter per concrete `(actor, contract)`
 * scope: the contract comes from `.withId(id)`, the single-record read form
 * (templates/SINGLE-READ.md). Registered under the same module name as
 * `useContracts`; the scope key carries the differentiation.
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete actor.
 */
function createContractForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const { t } = useI18n();

  const actorScope = config.actor as ScopeActorTypes;

  // SINGLE-READ step 3: the id comes from `.withId(id)` — `config.id` — and is
  // never re-derived from `config.context` (templates/SINGLE-READ.md).
  const contractId = config.id;

  const machineService = interpret(
    contractMachine.withContext({ contractId }),
    {
      id: scopeKey,
      devTools: false
    }
  );
  machineService.start();

  const actorRef = createActor(machineService);
  if (!actorRef) {
    throw new DetailedError(
      t("error.contract_not_available"),
      responseCodes.Service_Unavailable,
      ErrorOrigin.Headless,
      { scope: config }
    );
  }

  const actions = createContractActions(actorScope, actorRef, scopeKey);

  return {
    /** Sub-composable for manager actions (the three writes, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for manager context (the contract, its raw record, the error). */
    useContext: () => createContractContext(actorScope, actorRef),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createContractInternals(actorScope, actorRef),

    /** Sub-composable for manager meta (state flags). */
    useMeta: () => createContractMeta(actorScope, actorRef)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for ONE contract.
 *
 * @example
 * ```ts
 * const manager = useContract().as('client').withId(contractId)
 * await manager.useActions().isReady()
 * await manager.useActions().setPaymentMethod({ paymentDetailsId })
 * ```
 */
export const useContract = createScopedComposable<
  ReturnType<typeof createContractForScope>,
  ContractScopeMatrix
>("contract", createContractForScope);

export type UseContract = ReturnType<typeof useContract>;
