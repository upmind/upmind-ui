// --- external
import { computed } from "vue";
import {
  castArray,
  defaultsDeep,
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
import { useBasketProduct, type BasketProduct } from "../basketProduct";
import { useConfig } from "../config";
import { contextValue } from "../../utils";

// --- types
import type { ActorRef } from "xstate";
import { PRODUCT_SETUP_MODE, UIContext } from "../config/schema/types";

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
  const { products: basketProducts } = useBasket();
  const { ui } = useConfig({ context: UIContext.CHECKOUT });

  // --- context
  const products = computed((): BasketProduct[] => {
    const mode = ui.productSetup.value;

    return filter(basketProducts.value, p => {
      // Always include invalid products
      if (p?.meta.invalid) return true;

      // Include deferred products with empty fields when mode is 'deferred'
      if (mode === PRODUCT_SETUP_MODE.DEFERRED && p?.meta?.deferred) {
        const provisionValues = get(p, "configuration.provisionFields", {});
        return some(provisionValues, isEmpty);
      }

      return false;
    });
  });

  const currentProduct = computed(() => first(products.value));

  const total = computed(() => size(products.value));

  // --- meta
  const meta = computed(() => ({
    isComplete: isEmpty(products.value),
    isAvailable: !isEmpty(basketProducts.value)
  }));

  // --- methods
  /**
   * Apply provision data to one or more products.
   * Uses defaultsDeep to merge - existing values are preserved, incoming fills gaps.
   */
  async function apply(
    data: Record<string, any>,
    productIds: string | string[]
  ): Promise<void> {
    const ids = castArray(productIds);

    const updates = map(ids, async id => {
      const bp = useBasketProduct(id);
      const existing = bp.model.value?.provisionFields ?? {};
      const merged = defaultsDeep({}, existing, data);

      await bp.setProvisioningFields(merged);
      return bp.update();
    });

    await Promise.allSettled(updates);
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
    /** The first product requiring setup. Use this to display the current product to fix. */
    currentProduct,
    /** All products requiring setup (invalid or deferred based on config mode). */
    products,
    /** Total count of products requiring setup. */
    total,
    // --- meta
    /** Meta flags: isComplete (no products left), isAvailable (basket has products). */
    meta,
    // --- methods
    /** Apply provision data to one or more products with merge semantics. */
    apply,
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
    getNextRequiringSetup
  };
}

export type UseProductSetup = ReturnType<typeof useProductSetup>;
