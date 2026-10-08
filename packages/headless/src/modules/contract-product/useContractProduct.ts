import { computed, effectScope, shallowRef, watch } from "vue";
import { interpret } from "xstate";
import { useProductConfig } from "../product";
import { useProductCatalogue } from "../product-catalogue";
import { createScopedComposable } from "../scope/scope.builder";
import { useI18n } from "../system-localisation";
import { contractProductMachine } from "./contract-product.machine";
import {
  omitMigrationSchema,
  omitMigrationUischema
} from "./contract-product.schemas";
import {
  createContractProductServices,
  useContractProductMachineServices
} from "./contract-product.services";
import {
  CONTRACT_PRODUCT_SCOPE_MATRIX,
  ContractProductMigrationStates,
  MIGRATION_PAGE_SIZE,
  MigrationConfigOmittedMembers,
  MigrationModelOmittedFields
} from "./contract-product.types";
import { createContractProductActions } from "./useContractProduct.actions";
import { createContractProductContext } from "./useContractProduct.context";
import { createContractProductInternals } from "./useContractProduct.internals";
import { createContractProductMeta } from "./useContractProduct.meta";
import {
  contextValue,
  createActor,
  DetailedError,
  ErrorOrigin,
  responseCodes,
  stateMatches
} from "../../utils";
import { compact, isEqual, isNumber, map, omit, values } from "lodash-es";
import type {
  ContractProduct,
  ContractProductActionMembers,
  ContractProductContextMembers,
  ContractProductInternalMembers,
  ContractProductMetaMembers,
  ContractProductScope,
  ContractProductScopeMatrix,
  MigrationConfig,
  MigrationConfigHolder,
  MigrationConfigInputs,
  MigrationHolders,
  MigrationListInputs,
  MigrationReadInputs,
  ScopedHolder
} from "./contract-product.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ComputedRef, EffectScope } from "vue";
import type { ActorRef, AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProduct
 * @description Scoped manager for ONE contract product, backed by
 * `contract-product.machine.ts`. An instance: one interpreter per concrete
 * `(actor, id)` pair, the product coming from `.withId(id)`; `destroy()` stops
 * it and removes it from the registry. Registered under the same module name
 * as `useContractProducts`; the scope key carries the differentiation. It also
 * owns the three scoped holders of a migration (the product count, the product
 * list and the configurator of the chosen product), so every sub-composable
 * reads the same instances.
 */

/**
 * One scoped holder: `null` until its inputs are resolved, built inside its
 * own detached effect scope. Each rebuild, and inputs that go incomplete, stop
 * the old scope first, so its bindings and query observers stop with it.
 */
function createHolder<TInputs, THolder>(
  inputs: ComputedRef<TInputs | null>,
  build: (resolved: TInputs) => THolder
): ScopedHolder<THolder> {
  const holder = shallowRef<THolder | null>(null);
  let scope: EffectScope | undefined;
  let last: TInputs | null | undefined;

  const stop = (): void => {
    scope?.stop();
    scope = undefined;
    holder.value = null;
  };

  const unwatch = watch(
    inputs,
    next => {
      if (isEqual(next, last)) return;
      last = next;
      stop();
      if (!next) return;
      scope = effectScope(true);
      holder.value = scope.run(() => build(next)) ?? null;
    },
    { immediate: true, flush: "sync" }
  );
  const dispose = (): void => {
    unwatch();
    stop();
  };

  return { dispose, holder };
}

function createContractProductForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
): ContractProductScope {
  const actorScope = config.actor;

  /** ONE services instance for this scope, threaded into the machine config. */
  const service = createContractProductServices(actorScope, config.context);

  const machineService = interpret(
    contractProductMachine
      .withConfig({ services: useContractProductMachineServices(service) })
      .withContext({ scopeActor: actorScope, contractProductId: config.id }),
    // The scope key, not the product id: two managers on different products
    // are two distinct interpreters.
    { id: scopeKey, devTools: false }
  );
  machineService.start();

  const actor = createActor(machineService);
  if (!actor) {
    throw new DetailedError(
      useI18n().t("error.contract_product_not_available"),
      responseCodes.Service_Unavailable,
      ErrorOrigin.Headless,
      { scope: config }
    );
  }
  const { state } = actor;

  // The two product reads need their ids, currency and account before their
  // `const` filter leaves can be built, and the list needs the current term.
  const readInputs = computed<MigrationReadInputs | null>(() => {
    const product = contextValue<ContractProduct>(state, "contractProduct");
    const ids = compact(
      map(product?.allowedMigrations, "migration_product_id")
    );
    if (
      !ids.length ||
      !product?.contractCurrencyId ||
      !product.contractAccountId
    )
      return null;

    return {
      ids,
      currencyId: product.contractCurrencyId,
      accountId: product.contractAccountId
    };
  });
  const listInputs = computed<MigrationListInputs | null>(() => {
    const term = contextValue<number>(
      state,
      "contractProduct.billingCycleMonths"
    );
    return readInputs.value && isNumber(term)
      ? { ...readInputs.value, term }
      : null;
  });
  const configInputs = computed<MigrationConfigInputs | null>(() => {
    const ref = contextValue<ActorRef<AnyEventObject>>(state, "migration.ref");
    return ref ? { id: ref.id, ref } : null;
  });

  const count = createHolder(readInputs, ({ ids, currencyId, accountId }) =>
    useProductCatalogue({
      scope: {
        ids,
        currencyId,
        accountId,
        recurringOnly: true,
        orderable: true,
        countOnly: true,
        categories: false
      }
    })
  );
  const list = createHolder(
    listInputs,
    ({ ids, currencyId, accountId, term }) =>
      useProductCatalogue({
        infinite: true,
        pagination: { limit: MIGRATION_PAGE_SIZE },
        scope: {
          ids,
          currencyId,
          accountId,
          billingCycleMonths: term,
          orderable: true,
          categories: false,
          enabled: () =>
            stateMatches(state, values(ContractProductMigrationStates))
        }
      })
  );
  const migrationConfig = createHolder(
    configInputs,
    ({ ref }): MigrationConfigHolder => {
      const full = useProductConfig(ref);
      const configurator: MigrationConfig = {
        ...omit(full, values(MigrationConfigOmittedMembers)),
        setConfig: data =>
          full.setConfig(omit(data, values(MigrationModelOmittedFields))),
        schema: computed(() => omitMigrationSchema(full.schema.value)),
        uischema: computed(() => omitMigrationUischema(full.uischema.value))
      };
      return { config: configurator, state: full.state };
    }
  );

  const holders: MigrationHolders = {
    config: migrationConfig.holder,
    count: count.holder,
    dispose: () => {
      count.dispose();
      list.dispose();
      migrationConfig.dispose();
    },
    list: list.holder
  };

  /** ONE actions instance per scope; the layers below stay lazy. */
  const actions = createContractProductActions(
    actorScope,
    actor,
    scopeKey,
    holders
  );

  return {
    /** Sub-composable for manager actions (the writes, lifecycle). */
    useActions: (): ContractProductActionMembers => actions,

    /** Sub-composable for manager context (the product, its error, derived values). */
    useContext: (): ContractProductContextMembers =>
      createContractProductContext(actorScope, actor, holders),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: (): ContractProductInternalMembers =>
      createContractProductInternals(actorScope, actor),

    /** Sub-composable for manager meta (node flags and record facts). */
    useMeta: (): ContractProductMetaMembers =>
      createContractProductMeta(actorScope, actor, holders)
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
>(
  "contract-product",
  createContractProductForScope,
  CONTRACT_PRODUCT_SCOPE_MATRIX
);

export type UseContractProduct = ReturnType<typeof useContractProduct>;
