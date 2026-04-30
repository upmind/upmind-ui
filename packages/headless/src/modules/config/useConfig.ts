import { computed, type Ref, toValue } from "vue";
import { useBreakpoints, breakpointsTailwind } from "@vueuse/core";
import { has } from "lodash-es";
import {
  initializeMeta,
  createUIMetaProxy,
  createDataProxy,
  injectConfig,
  provideConfig,
  useCachedRef
} from "./utils";
import { buildConditionState } from "./config.conditions";
import { useBrand } from "../brand/useBrand";
import { useBasket } from "../basket/useBasket";
import type {
  UseMetaOptions,
  UseMetaResult,
  WithMetaOptions,
  Viewport
} from "./types";
import { type BrandMeta } from "../brand/types";
import type { IProduct } from "@upmind-automation/types";

export { provideConfig, injectConfig } from "./utils";

export function useConfig(options?: UseMetaOptions): UseMetaResult {
  const injected =
    !options?.context && !options?.provide && !options?.brand && injectConfig();

  if (injected) return injected;

  const {
    context,
    brand: brandOption,
    category,
    product,
    optionGroup,
    option,
    basket: basketOption,
    basketProduct,
    provide: shouldProvide
  } = options ?? {};

  const breakpoints = useBreakpoints(breakpointsTailwind);
  const viewport = computed<Viewport>(() => {
    if (breakpoints.smaller("md").value) return "sm";
    if (breakpoints.smaller("lg").value) return "md";
    return "lg";
  });

  // Only call useBrand() when brand option is not provided (avoids circular dependency)
  const { uiCart } = has(options, "brand") ? { uiCart: undefined } : useBrand();

  const brand = useCachedRef(
    computed(() => toValue(brandOption) ?? uiCart?.value)
  ) as Ref<BrandMeta["cart"]>;

  // Only call useBasket() when basket option is not provided.
  // Mirrors the brand pattern; explicit `basket: undefined` opts out (used by
  // useBrand to break the useBasket → useBrand → useConfig → useBasket cycle).
  const { basket: basketFromHook } = has(options, "basket")
    ? { basket: undefined }
    : useBasket();

  const basket = computed(() => toValue(basketOption) ?? basketFromHook?.value);

  const items = computed(() =>
    initializeMeta({
      context: toValue(context),
      viewport: toValue(viewport),
      brand: brand.value,
      category: toValue(category),
      // basketProduct contributes to the product cascade tier when present —
      // line-item rendering uses the line item's productDetails.uiMeta as the
      // product-scope input. Falls back to explicit product otherwise.
      product: toValue(basketProduct) ?? toValue(product),
      optionGroup: toValue(optionGroup),
      option: toValue(option)
    })
  );

  const ui = computed(() => items.value.meta);
  const data = computed(() => items.value.data);

  const conditionState = computed(() => {
    const bp = toValue(basketProduct);
    // Derive product.* state source from basketProduct.product when no
    // explicit product is passed — caller rendering a line item only needs
    // to pass the line item itself.
    const productForState =
      (toValue(product)?.productDetails as IProduct | undefined) ?? bp?.product;
    return buildConditionState({
      product: productForState,
      basketProduct: bp,
      basket: basket.value
    });
  });

  function withScopes(extendOptions: WithMetaOptions): UseMetaResult {
    return useConfig({
      context,
      category: extendOptions.category ?? category,
      product: extendOptions.product ?? product,
      optionGroup: extendOptions.optionGroup ?? optionGroup,
      option: extendOptions.option ?? option,
      basketProduct: extendOptions.basketProduct ?? basketProduct
    });
  }

  const result: UseMetaResult = {
    ui: createUIMetaProxy(ui, conditionState),
    data: createDataProxy(
      data,
      computed(() => toValue(product))
    ),
    with: withScopes
  };

  if (shouldProvide) {
    provideConfig(result);
  }

  return result;
}
