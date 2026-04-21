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
import type {
  BasketProduct,
  BasketOptionSummary,
  BasketUpsellSummary
} from "./types";
import type {
  Benefit,
  ProductModel,
  SubproductDetails,
  SubproductValue,
  UseProductConfig
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
        (basketProduct.upsells ?? []) as BasketUpsellSummary[],
        "toggle.selected"
      ),
      "toggle.valueId"
    )
  );

  /**
   * Checks whether a specific option value has upsells enabled by resolving
   * `data.optionUpsellEnabled` at the option scope and `ui.optionUpsells.isVisible`
   * at the option-category scope.
   */
  function isOptionUpsellEnabled(
    optionGroup: SubproductDetails,
    option: SubproductValue | BasketOptionSummary
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
   * Builds raw upsell summaries from the resolved option catalogue when
   * available (includes coupon-adjusted pricing), otherwise falls back to
   * catalog-level data from the basket response.
   *
   * Options that were already selected before the inline editor opened
   * (i.e. configured on the full product page) are excluded — they are
   * managed elsewhere and should not appear as inline toggles.
   */
  function buildUpsellSummaries(
    availableOptions?: SubproductDetails[],
    selections?: ProductModel["options"]
  ): BasketUpsellSummary[] {
    const catalogUpsells = (basketProduct.upsells ??
      []) as BasketUpsellSummary[];
    if (isEmpty(availableOptions)) return catalogUpsells;

    const selected = flatMap(selections, group =>
      map(group, (choice, id) => ({
        product_id: choice.productId ?? id,
        unit_quantity: choice.quantity
      }))
    );
    const summaries = parseOptionUpsells(selected as any, availableOptions);

    return filter(
      summaries,
      s => !includes(preConfiguredIds, s.toggle.valueId)
    );
  }

  /**
   * Resolves the upsells eligible to render inline, paired with their
   * resolved benefits and the option group they belong to. Applies
   * {@link isOptionUpsellEnabled} per option and the container-level
   * `ui.optionUpsells.isVisible` gate.
   *
   * Reads selections from the config's `baseModel` (the persisted state) so
   * the UI reflects only confirmed toggles, not optimistic in-flight ones.
   */
  function resolveUpsells(config?: UseProductConfig): {
    upsell: BasketUpsellSummary;
    option: SubproductDetails;
    benefits?: Benefit[];
  }[] {
    if (!ui.optionUpsells.isVisible) return [];

    const availableOptions = config?.options?.value;
    const selections = config?.baseModel?.value?.options;

    return compact(
      map(buildUpsellSummaries(availableOptions, selections), upsell => {
        const group = find(availableOptions, {
          id: upsell.toggle.categoryId
        });
        if (!group || !isOptionUpsellEnabled(group, upsell)) return undefined;

        const { data } = parentConfig.with({
          product: () => basketProduct,
          optionGroup: () => group,
          option: () => upsell
        });
        return { upsell, option: group, benefits: data.optionBenefits };
      })
    );
  }

  /**
   * Drops pricing rows whose id is already rendered as a resolved upsell,
   * so a selected upsell doesn't appear twice. The main product (index 0)
   * is always kept.
   */
  function filterPricing<T extends { id?: string }>(
    pricing: T[] | undefined,
    upsells: { upsell: BasketOptionSummary }[]
  ): T[] {
    const upsellIds = compact(map(upsells, "upsell.id"));
    return filter(
      pricing,
      (item, index) => index === 0 || !includes(upsellIds, item.id)
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
     * Resolves the upsells to render inline, each paired with its benefits.
     * Applies per-option `optionUpsellEnabled`, container-level visibility,
     * and pre-configured exclusions.
     */
    resolveUpsells,

    /**
     * Drops pricing rows that are already rendered as inline upsells so they
     * don't appear twice. Keeps index 0 (the main product).
     */
    filterPricing,

    /** Inline control flags for this product. */
    meta
  };
};

export type UseBasketProductInline = ReturnType<typeof useBasketProductInline>;
