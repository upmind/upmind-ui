// --- external
import { computed, ref, watch } from "vue";
import {
  filter,
  find,
  first,
  get,
  includes,
  isEmpty,
  map,
  reject,
  size,
  some,
  values
} from "lodash-es";

// --- internal
import { useBasket } from "../basket";
import {
  useBasketProduct,
  useBasketProducts,
  type BasketProduct
} from "../basketProduct";
import { useConfig } from "../config";
import { contextValue, useModelParser, type ErrorObject } from "../../utils";
import { basketProductRequiresSetup } from "./utils";

// --- types
import type { ActorRef } from "xstate";
import { UIContext } from "../config/schema/types";
import type { ProductModel } from "../product/types";

// -----------------------------------------------------------------------------
/**
 * @module productSetup/useProductSetup
 * @description Composable for the Product Setup flow. Provides context, meta, and
 * methods for guiding users through fixing invalid product configuration before
 * checkout. Shows ONE product at a time with only the fields that have errors.
 */

/**
 * Composable for the Product Setup flow.
 *
 * Exposes invalid products, filtered UISchema for the current product,
 * and an `apply` method to update provision fields with merge semantics.
 *
 * Respects `@context productSetup` config:
 * - `required` (default): only products with validation errors
 * - `deferred`: products with errors OR deferred fields with empty values
 */
export function useProductSetup() {
  const { products: basketProducts, isReady, meta: basketMeta } = useBasket();
  const { configure } = useBasketProducts();
  const { ui } = useConfig({ context: UIContext.CHECKOUT });

  // --- context
  const products = computed((): BasketProduct[] => {
    const mode = ui.productSetup.value;
    return filter(basketProducts.value, bp =>
      basketProductRequiresSetup(bp, mode)
    );
  });

  const currentProduct = computed(() =>
    find(basketProducts.value, { id: currentBpId.value })
  );

  const total = computed(() => size(products.value));

  // Products with overlapping error paths (for "apply to similar")
  const similarProducts = computed((): BasketProduct[] => {
    if (!currentBpId.value) return [];

    const mode = ui.productSetup.value;
    const current = find(basketProducts.value, { id: currentBpId.value });
    if (!current) return [];

    // Get all error paths from current product
    const currentErrors = get(current, "errors", []) as ErrorObject[];
    const currentErrorPaths = map(currentErrors, "instancePath");

    if (isEmpty(currentErrorPaths)) return [];

    // Find other products requiring setup with any overlapping error paths
    return filter(basketProducts.value, bp => {
      if (bp.id === current.id) return false;
      if (!basketProductRequiresSetup(bp, mode)) return false;

      const bpErrors = get(bp, "errors", []) as ErrorObject[];
      return some(bpErrors, (e: ErrorObject) =>
        includes(currentErrorPaths, e.instancePath)
      );
    });
  });

  // --- state
  // Current basket product ID being configured
  const currentBpId = ref<string>();

  // Selected product IDs for "apply to similar" - user can toggle via checkboxes
  const selectedProducts = ref<string[]>([]);

  // --- meta
  const meta = computed(() => ({
    /** True when basket is loading. */
    isLoading: basketMeta.value.isLoading,
    /** True when all products are complete (no products need setup). */
    isComplete: basketMeta.value.hasProducts && isEmpty(products.value),
    /** True when basket is available and there are products that need setup. */
    isAvailable: basketMeta.value.hasProducts && !isEmpty(products.value)
  }));

  // --- methods
  /**
   * Apply model data to selected similar products.
   * Uses target product's invalidSchema to strip model to only overlapping invalid fields.
   */
  async function apply(model: Partial<ProductModel>): Promise<void> {
    const updates = map(selectedProducts.value, async id => {
      const bp = useBasketProduct(id);
      const targetInvalidSchema = bp.invalidSchema?.value;

      if (!targetInvalidSchema) return;

      // Strip model to only fields TARGET product needs
      const overlappingModel = useModelParser(
        targetInvalidSchema,
        model,
        {},
        { allowExtraProps: false }
      );

      if (isEmpty(overlappingModel)) return;

      await bp.setConfig(overlappingModel);
      return bp.update();
    });

    await Promise.allSettled(updates);
    selectedProducts.value = [];
  }

  function getNextInvalid(actor?: ActorRef<any>): BasketProduct | undefined {
    const pid = get(actor, "state.context.model.productId", {});
    return first(reject(products.value, ["productId", pid]));
  }

  function getNextRelated(actor: ActorRef<any>): BasketProduct | undefined {
    const provisionFields = contextValue<Record<string, any>>(
      actor,
      "model.provisionFields"
    );

    if (isEmpty(provisionFields)) return;

    return find(basketProducts.value, bp => {
      const serviceIdentifier = get(bp, "serviceIdentifier");
      if (!serviceIdentifier) return false;
      const value = includes(values(provisionFields), serviceIdentifier);
      const hasError = !isEmpty(get(bp, "errors"));
      return value && hasError;
    });
  }

  function getNextRequiringSetup(
    actor?: ActorRef<any>
  ): BasketProduct | undefined {
    return getNextRelated(actor!) || getNextInvalid(actor);
  }

  function resetSelectedProducts(): void {
    selectedProducts.value = map(similarProducts.value, "id");
  }

  // --- side effects

  // Clean up stale selections when basket products change
  watch(basketProducts, () => {
    const validIds = map(similarProducts.value, "id");
    selectedProducts.value = filter(selectedProducts.value, id =>
      includes(validIds, id)
    );
  });

  // -----------------------------------------------------------------------------

  return {
    // --- context
    /** Configure a specific basket product for setup. Pass the bpid from route params. */
    configure: (bpid: BasketProduct["id"]) => {
      return configure(bpid, { allowMultipleEdits: true }).finally(() => {
        currentBpId.value = bpid;
        selectedProducts.value = map(similarProducts.value, "id");
      });
    },
    /** The first product requiring setup. Use this to display the current product to fix. */
    currentProduct,
    /** All products requiring setup (invalid or deferred based on config mode). */
    products,
    /** Selected product IDs for "apply to others" - defaults to all products. */
    selectedProducts,
    /** Total count of products requiring setup. */
    total,
    // --- meta
    /** Meta flags: isComplete (no products left), isAvailable (basket has products). */
    meta,
    // --- methods
    /** Apply provision data to one or more products with merge semantics. */
    apply,
    /** Wait for the basket to be ready before checking product setup status. */
    isReady,
    /** Reset selectedProducts to all similar products (call on cancel/apply). */
    resetSelectedProducts,
    /**
     * Get the next invalid product relative to a given basket product actor.
     * Excludes the actor's own product from results.
     */
    getNextInvalid,
    /**
     * Get a related product that has errors, relative to a given basket product actor.
     * Checks if the actor's provision fields reference another basket item's service identifier.
     * E.g., a hosting product references a domain - if that domain needs action, returns it
     * so you can route directly to fix it before resuming the normal flow.
     */
    getNextRelated,
    /**
     * Get the next product requiring setup relative to a given basket product actor.
     * Prioritizes related products (getNextRelated) over invalid ones (getNextInvalid).
     * Use as the primary navigation method for seamless related-product resolution.
     */
    getNextRequiringSetup,
    /** Products with overlapping missing provision fields (for "apply to similar"). */
    similarProducts
  };
}

export type UseProductSetup = ReturnType<typeof useProductSetup>;
