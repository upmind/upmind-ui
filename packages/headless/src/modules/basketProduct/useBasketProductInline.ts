// --- external
import { computed } from "vue";

// --- internal
import { useBasketProducts } from "./useBasketProducts";
import { useConfig } from "../config";
import { useI18n } from "../system";

// --- utils
import {
  compact,
  filter,
  find,
  flatMap,
  includes,
  isEmpty,
  map,
  reduce
} from "lodash-es";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";
import { parseOptionUpsells } from "./utils";

// --- types
import type { BasketProduct, BasketOptionSummary } from "./types";
import type {
  ProductModel,
  SubproductDetails,
  SubproductValue
} from "../product";
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

  const preConfiguredIds = compact(
    map(
      filter(
        (basketProduct.upsells ?? []) as BasketOptionSummary[],
        "meta.toggle.selected"
      ),
      "meta.toggle.valueId"
    )
  );

  /**
   * Checks whether a specific option value has upsells enabled by resolving
   * `data.optionUpsellEnabled` at the option scope and `ui.optionUpsells.isVisible`
   * at the option-category scope.
   */
  function isOptionUpsellEnabled(
    optionGroup: SubproductDetails,
    option: SubproductValue
  ): boolean {
    const { data, ui } = parentConfig.with({
      product: () => basketProduct,
      optionGroup: () => optionGroup,
      option: () => option
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

  /**
   * Resolves upsell summaries from the product machine's option data when
   * available (includes coupon-adjusted pricing), otherwise falls back to
   * catalog-level data from the basket response.
   *
   * Options that were already selected before the inline machine was spawned
   * (i.e. configured on the full product page) are excluded — they are managed
   * elsewhere and should not appear as inline toggles.
   *
   * @param machineOptions - Available option lookups from the product machine.
   * @param modelOptions - Current model selections (reflects toggle state).
   */
  function resolveUpsells(
    machineOptions?: SubproductDetails[],
    modelOptions?: ProductModel["options"]
  ): BasketOptionSummary[] {
    const catalogUpsells = (basketProduct.upsells ??
      []) as BasketOptionSummary[];
    if (isEmpty(machineOptions)) return catalogUpsells;

    const selected = flatMap(modelOptions, group =>
      map(group, (choice, id) => ({ product_id: choice.productId ?? id }))
    );
    const summaries = parseOptionUpsells(selected as any, machineOptions);

    // Exclude options that were pre-configured before inline editing began.
    return filter(
      summaries,
      s => !includes(preConfiguredIds, s.meta.toggle?.valueId)
    );
  }

  // --- computed

  /** Inline control flags for this product. */
  const meta = computed(() => {
    const hasUpsellOptions = !!basketProduct.productDetails.configurableInline;

    const showOptionUpsells = ui.optionUpsells.isVisible && hasUpsellOptions;
    const showTermSelector =
      ui.productTermSelector.isVisible && !basketProduct.meta?.oneoff;

    const showQuantity = !!basketProduct.productDetails.quantifiable;

    return {
      hasInlineControls: showOptionUpsells || showTermSelector || showQuantity,
      hasUpsellOptions,
      showOptionUpsells,
      showQuantity,
      showTermSelector
    };
  });

  // ---------------------------------------------------------------------------
  return {
    /** Product config API, available once the machine has resolved. */
    configure: () => configure(bpid, { allowMultipleEdits: true }),

    /**
     * Filters options to only those eligible for inline upsell.
     * Excludes required options and those without `optionUpsellEnabled`.
     */
    filterUpsellOptions,

    /**
     * Resolves upsell summaries with coupon-adjusted pricing when
     * machine options are available, otherwise returns catalog data.
     * Excludes pre-configured options automatically.
     */
    resolveUpsells,

    /** Inline control flags for this product. */
    meta
  };
};

export type UseBasketProductInline = ReturnType<typeof useBasketProductInline>;
