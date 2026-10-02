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
import { compact, isEqual, isNumber, map, omit } from "lodash-es";
import type {
  ContractProduct,
  ContractProductContext,
  ContractProductScopeMatrix,
  MigrationConfig,
  MigrationConfigHolder,
  MigrationHolders
} from "./contract-product.types";
import type { UseActor } from "../../utils";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ComputedRef, EffectScope } from "vue";
import type { ActorRef, AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/** The page size of the plan list — four plans for each page, as legacy asks [o5]. */
const MIGRATION_PAGE_SIZE = 4;

/** The members of `useProductConfig` a change of plan does not give. */
const MIGRATION_CONFIG_OMITTED = [
  "id",
  "state",
  "service",
  "onDone",
  "updateTerm",
  "isSelectedTerm",
  "updateQuantity",
  "incrementQuantity",
  "decrementQuantity",
  "provisionFields",
  "provisionFieldsSchema",
  "setProvisioningFields",
  "getProvisioningField",
  "setTrial"
];

/** The model keys a change of plan never sets: its form holds no trial and no provision field. */
const MIGRATION_MODEL_OMITTED = ["startTrial", "provisionFields"];

/** The inputs both plan reads need before their `const` filter leaves can be built. */
type MigrationReadInputs = {
  ids: string[];
  currencyId: string;
  accountId: string;
};

/**
 * One scoped holder: `null` until its inputs are resolved, built inside its
 * own detached effect scope. Each rebuild, and inputs that go incomplete, stop
 * the old scope first, so its bindings and query observers stop with it.
 */
function createHolder<TInputs, THolder>(
  inputs: ComputedRef<TInputs | null>,
  build: (resolved: TInputs) => THolder
) {
  const holder = shallowRef<THolder | null>(null);
  let scope: EffectScope | undefined;
  let last: TInputs | null | undefined;

  function stop() {
    scope?.stop();
    scope = undefined;
    holder.value = null;
  }

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

  return {
    holder,
    dispose() {
      unwatch();
      stop();
    }
  };
}

/** The configurator of the chosen plan, over its child. */
function buildMigrationConfig(
  child: ActorRef<AnyEventObject>
): MigrationConfigHolder {
  const full = useProductConfig(child);

  return {
    config: {
      ...omit(full, MIGRATION_CONFIG_OMITTED),
      setConfig: data => full.setConfig(omit(data, MIGRATION_MODEL_OMITTED)),
      schema: computed(() => omitMigrationSchema(full.schema.value)),
      uischema: computed(() => omitMigrationUischema(full.uischema.value))
    } as MigrationConfig,
    isReady: computed(() => stateMatches(full.state, ["available"]))
  };
}

/**
 * The count, the list and the configurator of one manager. The two plan reads
 * need their ids, currency and account before they can be built, and the list
 * needs the current term too.
 */
function createMigrationHolders(actor: UseActor): MigrationHolders {
  const { state } = actor;

  const isOpen = computed(() =>
    stateMatches(state, [
      "available.migrating.choosing",
      "available.migrating.configuring"
    ])
  );

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

  const listInputs = computed(() => {
    const term = contextValue<number>(
      state,
      "contractProduct.billingCycleMonths"
    );
    return readInputs.value && isNumber(term)
      ? { ...readInputs.value, term }
      : null;
  });

  const configInputs = computed(() => {
    const id = contextValue<ActorRef<AnyEventObject>>(
      state,
      "migration.ref"
    )?.id;
    return id ? { id } : null;
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
          enabled: () => isOpen.value
        }
      })
  );

  const config = createHolder(configInputs, () =>
    buildMigrationConfig(
      contextValue<ActorRef<AnyEventObject>>(state, "migration.ref")!
    )
  );

  return {
    count: count.holder,
    list: list.holder,
    config: config.holder,
    isMigrationTargetReady: computed(
      () => config.holder.value?.isReady.value ?? false
    ),
    dispose() {
      count.dispose();
      list.dispose();
      config.dispose();
    }
  };
}

// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProduct
 * @description Scoped manager for ONE contract product, backed by the locked
 * `contract-product.machine.ts` (R4). One interpreter per concrete
 * `(actor, id)` pair: the product comes from `.withId(id)`,
 * the single-record read form (templates/SINGLE-READ.md). Registered under the same module name as
 * `useContractProducts`; the scope key carries the differentiation. It also owns
 * the three scoped holders of a change of plan (the plan count, the plan list
 * and the configurator of the chosen plan), so every sub-composable reads the
 * same instances.
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

  const holders = createMigrationHolders(actorRef);

  const actions = createContractProductActions(
    actorScope,
    actorRef,
    scopeKey,
    holders
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for manager actions (the five writes, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for manager context (the product, its error, derived values). */
    useContext: () =>
      createContractProductContext(actorScope, actorRef, holders),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createContractProductInternals(actorScope, actorRef),

    /** Sub-composable for manager meta (node flags and record facts). */
    useMeta: () => createContractProductMeta(actorScope, actorRef, holders)
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
