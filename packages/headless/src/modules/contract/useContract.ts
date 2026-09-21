import { interpret } from "xstate";
import { createScopedComposable } from "../scope/scope.builder";
import { useI18n } from "../system-localisation";
import contractMachine from "./contract.machine";
import { CONTRACT_SCOPE_MATRIX, ContractContextTypes } from "./contract.types";
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
 * scope: the contract comes from `.for('contract', id)`. Registered under the
 * same module name as `useContracts`; the scope key carries the
 * differentiation.
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete actor.
 */
function createContractForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const { t } = useI18n();

  const actorScope = config.actor as ScopeActorTypes;

  const contractId =
    config.context?.type === ContractContextTypes.CONTRACT
      ? config.context.id
      : undefined;

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

  return {
    /** Sub-composable for manager actions (the three writes, lifecycle). */
    useActions: () => createContractActions(actorScope, actorRef, scopeKey),

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
 * const manager = useContract().as('client').for('contract', contractId)
 * await manager.useActions().isReady()
 * await manager.useActions().setPaymentMethod({ paymentDetailsId })
 * ```
 */
export const useContract = createScopedComposable<
  ReturnType<typeof createContractForScope>,
  ContractScopeMatrix
>("contract", createContractForScope, CONTRACT_SCOPE_MATRIX);

export type UseContract = ReturnType<typeof useContract>;
