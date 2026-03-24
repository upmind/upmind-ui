// --- external
import { computed } from "vue";

// --- internal
import { useBasketProducts } from "./useBasketProducts";
import { useConfig } from "../config";
import { useI18n } from "../system";

// --- utils
import { filter, find, isEmpty, reduce } from "lodash-es";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";

// --- types
import type { BasketProduct } from "./types";
import type { SubproductDetails, SubproductValue } from "../product";
// -----------------------------------------------------------------------------

/**
 * @module basketProduct/useBasketProductInline
 * @description Per-product inline editor composable. Takes a basket product ID,
 * resolves inline control meta, and spawns the config machine when needed.
 * Follows the same configure pattern as Edit.vue.
 */
export const useBasketProductInline = (bpid: string) => {
  const { t } = useI18n();
  const { products, configure } = useBasketProducts();
  const parentConfig = useConfig();
  const basketProduct = find(products.value, { id: bpid }) as BasketProduct;

  if (isEmpty(basketProduct))
    throw new DetailedError(
      t("error.basket_product_not_found"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

  const { ui } = parentConfig.with({
    product: () => basketProduct
  });

  // --- private

  /**
   * Checks whether a specific option value has upsells enabled by resolving
   * `data.optionUpsellEnabled` at the option scope and `ui.optionUpsells.isVisible`
   * at the option-category scope.
   */
  function isOptionUpsellEnabled(
    optionGroup: SubproductDetails,
    option: SubproductValue
  ): boolean {
    const { data } = parentConfig.with({
      product: () => basketProduct,
      option: () => option
    });
    const { ui } = parentConfig.with({
      product: () => basketProduct,
      optionGroup: () => optionGroup
    });

    return !!data.optionUpsellEnabled && ui.optionUpsells.isVisible;
  }

  /**
   * Filters option groups to only include upsell-eligible values.
   * Each value is checked individually for `optionUpsellEnabled`. Groups with
   * no eligible values are excluded entirely.
   */
  function filterUpsellOptions(
    options: SubproductDetails[]
  ): SubproductDetails[] {
    return reduce(
      options,
      (result: SubproductDetails[], optionGroup) => {
        if (optionGroup.meta.required) return result;

        const eligibleValues = filter(optionGroup.values, option =>
          isOptionUpsellEnabled(optionGroup, option)
        );

        if (!isEmpty(eligibleValues)) {
          result.push({ ...optionGroup, values: eligibleValues });
        }

        return result;
      },
      []
    );
  }

  // --- computed

  /** Inline control flags for this product. */
  const meta = computed(() => {
    const showOptionUpsells = ui.optionUpsells.isVisible;

    const showTermSelector =
      ui.productTermSelector.isVisible && !basketProduct.meta?.oneoff;

    const showQuantity = !!basketProduct.productDetails.quantifiable;

    return {
      hasInlineControls: showOptionUpsells || showTermSelector || showQuantity,
      showOptionUpsells,
      showQuantity,
      showTermSelector
    };
  });

  // ---------------------------------------------------------------------------
  return {
    /** Product config API, available once the machine has resolved. */
    configure: () => configure(bpid),

    /**
     * Filters options to only those eligible for inline upsell.
     * Excludes required options and those without `optionUpsellEnabled`.
     */
    filterUpsellOptions,

    /** Inline control flags for this product. */
    meta
  };
};

export type UseBasketProductInline = ReturnType<typeof useBasketProductInline>;
