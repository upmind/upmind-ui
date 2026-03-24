// --- external
import { computed, onScopeDispose, ref } from "vue";

// --- internal
import { useBasketProducts } from "./useBasketProducts";
import { useConfig } from "../config";

// --- utils
import { difference, forEach, reduce, set, some, unset } from "lodash-es";

// --- types
import type { BasketProduct, InlineEditorState } from "./types";
import type { UseBasketProduct } from "./useBasketProduct";
// -----------------------------------------------------------------------------

/**
 * @module basketProduct/useBasketProductsInline
 * @description Wraps `useBasketProducts` and adds per-product inline editor
 * state. Resolves meta synchronously to determine which products need inline
 * controls, then spawns config machines asynchronously via `configure`.
 */

/**
 * Extends `useBasketProducts` with per-product inline editor state.
 *
 * Resolves meta properties (`optionUpsellEnabled`, `optionUpsells`,
 * `productTermSelector`) for each basket product and conditionally
 * spawns a product config machine via `configure` only when inline
 * editing is enabled.
 *
 * @returns The {@link UseBasketProductsInline} composable API.
 */
export const useBasketProductsInline = () => {
  const basketProducts = useBasketProducts();
  const { products, configure, isReady: basketIsReady } = basketProducts;

  // --- state
  const editors: Record<string, InlineEditorState> = {};
  const editorVersion = ref(0);

  // --- private

  /**
   * Resolves meta for a single basket product and determines
   * which inline controls should be displayed.
   */
  function resolveProductMeta(
    product: BasketProduct
  ): Omit<InlineEditorState, "config" | "isConfiguring"> {
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
   * Builds the editors map from the current basket products.
   * Resolves meta synchronously, then spawns config machines
   * asynchronously via `configure` for products with inline controls.
   */
  async function buildEditors(basketProducts: BasketProduct[]): Promise<void> {
    const activeIds = reduce(
      basketProducts,
      (acc, product) => {
        if (!editors[product.id]) {
          const meta = resolveProductMeta(product);

          set(editors, product.id, {
            ...meta,
            isConfiguring: meta.hasInlineControls
          });

          if (meta.hasInlineControls) {
            configure(product.id).then((config: UseBasketProduct) => {
              editors[product.id].config = config;
              editors[product.id].isConfiguring = false;
              editorVersion.value++;
            });
          }
        }

        acc.push(product.id);
        return acc;
      },
      [] as string[]
    );

    // Clean up stale editors
    forEach(difference(Object.keys(editors), activeIds), id => {
      editors[id]?.config?.stop?.();
      unset(editors, id);
    });
  }

  // --- methods

  /**
   * Retrieves inline editor state for a specific basket product.
   */
  function getEditor(bpid: string): InlineEditorState | undefined {
    editorVersion.value;
    return editors[bpid];
  }

  /**
   * Rebuilds the editors map from current basket products.
   */
  async function refresh(): Promise<void> {
    if (products.value) {
      await buildEditors(products.value as BasketProduct[]);
    }
  }

  /**
   * Waits for the basket to be ready and resolves all inline editors.
   */
  async function isReady(): Promise<boolean> {
    return basketIsReady().then(async ready => {
      if (ready && products.value) {
        await buildEditors(products.value as BasketProduct[]);
      }
      return ready;
    });
  }

  // --- computed

  /** Extends basketProducts meta with inline editor flags. */
  const meta = computed(() => {
    editorVersion.value;
    return {
      ...basketProducts.meta.value,
      hasEditableProducts: some(editors, "hasInlineControls")
    };
  });

  // --- cleanup
  onScopeDispose(() => {
    forEach(editors, editor => editor?.config?.stop?.());
  });

  // ---------------------------------------------------------------------------
  return {
    ...basketProducts,

    // --- state
    /** Waits for the basket and inline editors to be ready. */
    isReady,

    /** Extends basketProducts meta with inline editor flags. */
    meta,

    // --- context
    /** Per-product inline editor state map. */
    editors,

    // --- methods
    /** Retrieves inline editor state for a specific product ID. */
    getEditor,

    /** Rebuilds the editors map from current basket products. */
    refresh
  };
};

/**
 * Type definition for the return value of the `useBasketProductsInline` composable.
 */
export type UseBasketProductsInline = ReturnType<
  typeof useBasketProductsInline
>;
