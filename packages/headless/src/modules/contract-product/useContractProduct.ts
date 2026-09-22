import { interpret } from "xstate";
import { createScopedComposable } from "../scope/scope.builder";
import { useI18n } from "../system-localisation";
import { contractProductMachine } from "./contract-product.machine";
import { createContractProductActions } from "./useContractProduct.actions";
import { createContractProductContext } from "./useContractProduct.context";
import { createContractProductInternals } from "./useContractProduct.internals";
import { createContractProductMeta } from "./useContractProduct.meta";
import {
  createActor,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import type {
  ContractProductContext,
  ContractProductScopeMatrix
} from "./contract-product.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProduct
 * @description Scoped manager for ONE contract product, backed by the locked
 * `contract-product.machine.ts` (R4). One interpreter per concrete
 * `(actor, contract-product)` scope: the product comes from `.withId(id)`,
 * the single-record read form (templates/SINGLE-READ.md). Registered under the same module name as
 * `useContractProducts`; the scope key carries the differentiation.
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete actor.
 */
function createContractProductForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const { t } = useI18n();

  const actorScope = config.actor as ScopeActorTypes;

  // SINGLE-READ step 3: the id comes from `.withId(id)` — `config.id` — and is
  // never re-derived from `config.context` (templates/SINGLE-READ.md).
  const contractProductId = config.id;

  const machineService = interpret(
    contractProductMachine.withContext({
      scopeActor: actorScope,
      contractProductId
    } as ContractProductContext),
    {
      // The scope key, not the product id: two managers on different products
      // are two distinct interpreters.
      id: scopeKey,
      devTools: false
    }
  );
  machineService.start();

  const actorRef = createActor(machineService);
  if (!actorRef) {
    throw new DetailedError(
      t("error.contract_product_not_available"),
      responseCodes.Service_Unavailable,
      ErrorOrigin.Headless,
      { scope: config }
    );
  }

  const actions = createContractProductActions(actorScope, actorRef, scopeKey);

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for manager actions (the five writes, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for manager context (the product, its error, derived values). */
    useContext: () => createContractProductContext(actorScope, actorRef),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createContractProductInternals(actorScope, actorRef),

    /** Sub-composable for manager meta (node flags and record facts). */
    useMeta: () => createContractProductMeta(actorScope, actorRef)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for ONE contract product.
 *
 * @example
 * ```ts
 * const manager = useContractProduct().as('client').withId(id)
 * await manager.useActions().isReady()
 * await manager.useActions().stopRenewing({ reason: 'moving provider' })
 * ```
 */
export const useContractProduct = createScopedComposable<
  ReturnType<typeof createContractProductForScope>,
  ContractProductScopeMatrix
>("contract-product", createContractProductForScope);

export type UseContractProduct = ReturnType<typeof useContractProduct>;
