// --- external
import { computed, ref, watch } from "vue";
import {
  castArray,
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
import { useQueryParams } from "../routing";
import { contextValue, useModelParser } from "../../utils";
import { basketProductRequiresSetup } from "./utils";

// --- types
import type { ActorRef } from "xstate";
import { UIContext } from "../config/schema/types";

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
  const {
    products: basketProducts,
    isReady: isBasketReady,
    meta: basketMeta
  } = useBasket();
  const { configure } = useBasketProducts();
  const { ui } = useConfig({ context: UIContext.CHECKOUT });

  async function isReady(): Promise<boolean> {
    await isBasketReady();
    return true;
  }

  // --- context
  const products = computed((): BasketProduct[] => {
    const mode = ui.productSetup.value;
    return filter(basketProducts.value, bp =>
      basketProductRequiresSetup(bp, mode)
    );
  });

  const currentProduct = computed(() => first(products.value));

  const total = computed(() => size(products.value));

  const { basketProductId } = useQueryParams();

  // Products with overlapping error paths (for "apply to similar")
  const similarProducts = computed((): BasketProduct[] => {
    const mode = ui.productSetup.value;
    const current = find(basketProducts.value, { id: basketProductId });
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

  // Selected product IDs for "apply to similar" - user can toggle via checkboxes
  const selectedProducts = ref<string[]>(map(similarProducts.value, "id"));

  // Prune stale IDs when basket refreshes
  watch(basketProducts, () => {
    selectedProducts.value = filter(selectedProducts.value, (id: string) =>
      some(similarProducts.value, ["id", id])
    );
  });

  // Reset selection to all similar products (call on cancel/apply)
  function resetSelectedProducts(): void {
    selectedProducts.value = map(similarProducts.value, "id");
  }

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
   * Apply model data to similar products.
   * Uses target product's invalidSchema to strip model to only overlapping invalid fields.
   */
  async function apply(
    model: Record<string, any>,
    productIds: string | string[]
  ): Promise<void> {
    const ids = castArray(productIds);

    const updates = map(ids, async id => {
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
    resetSelectedProducts();
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

  return {
    // --- context
    /** Configure a specific basket product for setup. Pass the bpid from route params. */
    configure,
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
