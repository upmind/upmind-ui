// --- external
import { computed, reactive, onUnmounted } from "vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasket } from "../basket";
import { useBasketProduct } from "./useBasketProduct";
import { useConfig } from "../config";

// --- utils
import { forEach, isEmpty, map, reduce, set, unset } from "lodash-es";
import { stateMatches } from "../../utils";

// --- types
import type { Ref, ComputedRef } from "vue";
import type { BasketProduct } from "./types";
import type { UseBasketProduct } from "./useBasketProduct";
// -----------------------------------------------------------------------------

/**
 * @module basketProduct/useBasketInlineEditors
 * @description Composable that resolves meta properties to determine which
 * inline editing controls (option upsells, term selector) should be shown
 * for each basket product. Conditionally spawns product config machines
 * only for products with inline-editable properties.
 */

/**
 * Per-product inline editor state including meta resolution flags
 * and an optional product config API (spawned only when needed).
 */
type InlineEditorState = {
  /** Whether option upsell toggles should be shown for this product. */
  showOptionUpsells: boolean;
  /** Whether the term selector dropdown should be shown for this product. */
  showTermSelector: boolean;
  /** Whether quantity controls should be shown for this product. */
  showQuantity: boolean;
  /** Whether any inline controls are available (triggers machine spawn). */
  hasInlineControls: boolean;
  /** Product config API, only present when hasInlineControls is true. */
  config?: UseBasketProduct;
};

/**
 * Provides per-product inline editor state for basket products.
 *
 * For each product in the basket, resolves the meta properties
 * (`optionUpsellEnabled`, `optionUpsells`, `productTermSelector`)
 * and conditionally spawns a product config machine only when
 * inline editing is enabled.
 *
 * @returns The {@link UseBasketInlineEditors} composable API.
 */
export const useBasketInlineEditors = () => {
  const { products, isReady: basketIsReady, meta: basketMeta } = useBasket();

  // --- state
  const editors = reactive<Record<string, InlineEditorState>>({});

  // --- private

  /**
   * Resolves meta for a single basket product and determines
   * which inline controls should be displayed.
   */
  function resolveProductMeta(
    product: BasketProduct
  ): Omit<InlineEditorState, "config"> {
    const { ui, data } = useConfig().with({
      product: () => product
    });

    const optionUpsellEnabled = !!data.optionUpsellEnabled;
    const optionUpsellsVisible = ui.optionUpsells.isVisible;
    const termSelectorVisible = ui.productTermSelector.isVisible;

    const showOptionUpsells = optionUpsellEnabled && optionUpsellsVisible;
    const showTermSelector = termSelectorVisible;
    const showQuantity = !!product.productDetails?.quantifiable;

    return {
      showOptionUpsells,
      showTermSelector,
      showQuantity,
      hasInlineControls: showOptionUpsells || showTermSelector
    };
  }

  /**
   * Spawns a product config machine for a basket product
   * that has inline-editable properties.
   */
  function spawnEditor(product: BasketProduct): UseBasketProduct {
    return useBasketProduct(product.id);
  }

  /**
   * Builds the editors map from the current basket products.
   */
  function buildEditors(basketProducts: BasketProduct[]): void {
    // Track existing IDs so we can clean up stale entries
    const activeIds = new Set<string>();

    forEach(basketProducts, product => {
      activeIds.add(product.id);

      // Skip if already resolved
      if (editors[product.id]) return;

      const meta = resolveProductMeta(product);

      set(editors, product.id, {
        ...meta,
        config: meta.hasInlineControls ? spawnEditor(product) : undefined
      });
    });

    // Clean up editors for products no longer in the basket
    forEach(Object.keys(editors), id => {
      if (!activeIds.has(id)) {
        const editor = editors[id];
        if (editor?.config?.stop) {
          editor.config.stop();
        }
        unset(editors, id);
      }
    });
  }

  // --- methods

  /**
   * Retrieves inline editor state for a specific basket product.
   */
  function getEditor(bpid: string): InlineEditorState | undefined {
    return editors[bpid];
  }

  /**
   * Waits for the basket to be ready and resolves all inline editors.
   */
  async function isReady(): Promise<boolean> {
    return basketIsReady().then(ready => {
      if (ready && products.value) {
        buildEditors(products.value as BasketProduct[]);
      }
      return ready;
    });
  }

  // --- computed

  /** Products that have at least one inline control enabled. */
  const editableProducts = computed(() =>
    reduce(
      editors,
      (acc, editor, id) => {
        if (editor.hasInlineControls) {
          acc.push(id);
        }
        return acc;
      },
      [] as string[]
    )
  );

  /** True if any product has inline controls. */
  const hasEditableProducts = computed(() => !isEmpty(editableProducts.value));

  // ---------------------------------------------------------------------------
  return {
    // --- state
    /** Waits for the basket and inline editors to be ready. */
    isReady,

    // --- context
    /** Per-product inline editor state map. */
    editors,

    /** IDs of products that have at least one inline control. */
    editableProducts,

    /** True if any basket product has inline editing enabled. */
    hasEditableProducts,

    // --- methods
    /** Retrieves inline editor state for a specific product ID. */
    getEditor,

    /** Rebuilds the editors map from current basket products. */
    refresh: () => {
      if (products.value) {
        buildEditors(products.value as BasketProduct[]);
      }
    }
  };
};

/**
 * Type definition for the return value of the `useBasketInlineEditors` composable.
 */
export type UseBasketInlineEditors = ReturnType<typeof useBasketInlineEditors>;
