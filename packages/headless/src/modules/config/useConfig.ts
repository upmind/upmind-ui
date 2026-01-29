import { computed, type Ref, toValue } from "vue";
import { useBreakpoints, breakpointsTailwind } from "@vueuse/core";
import { has } from "lodash-es";
import {
  initializeMeta,
  createUIMetaProxy,
  createDataProxy,
  injectConfig,
  provideConfig,
  useGuardedRef
} from "./utils";
import { useBrand } from "../brand/useBrand";
import type {
  UseMetaOptions,
  UseMetaResult,
  WithMetaOptions,
  Viewport
} from "./types";
import { type BrandMeta } from "../brand/types";

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
  const brand = computed(() => toValue(brandOption) ?? uiCart?.value) as Ref<
    BrandMeta["cart"]
  >;

  const items = useGuardedRef(
    computed(() =>
      initializeMeta({
        context: toValue(context),
        viewport: toValue(viewport),
        brand: brand.value,
        category: toValue(category),
        product: toValue(product),
        optionGroup: toValue(optionGroup),
        option: toValue(option)
      })
    ),
    () => !!brand.value
  );

  const ui = computed(() => items.value.meta);
  const data = computed(() => items.value.data);

  function withScopes(extendOptions: WithMetaOptions): UseMetaResult {
    return useConfig({
      context,
      category: extendOptions.category ?? category,
      product: extendOptions.product ?? product,
      optionGroup: extendOptions.optionGroup ?? optionGroup,
      option: extendOptions.option ?? option
    });
  }

  const result: UseMetaResult = {
    ui: createUIMetaProxy(ui),
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
