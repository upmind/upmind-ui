import { computed, Ref, toValue } from "vue";
import { useBreakpoints, breakpointsTailwind } from "@vueuse/core";
import {
  initializeMeta,
  createUIMetaProxy,
  createDataProxy,
  injectConfig,
  provideConfig
} from "./utils";
import { useBrand } from "../brand/useBrand";
import useUpmind from "../../";
import type {
  UseMetaOptions,
  UseMetaResult,
  WithMetaOptions,
  Viewport
} from "./types";
import { BrandMeta } from "../brand/types";

export { provideConfig, injectConfig } from "./utils";

// -----------------------------------------------------------------------------

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

  // Brand can be passed as an option to allow using meta within the brand module
  // without creating a circular dependency
  const brand = computed(
    () => toValue(brandOption) ?? useBrand().uiCart.value
  ) as Ref<BrandMeta["cart"]>;

  const items = computed(() =>
    initializeMeta({
      context: toValue(context),
      viewport: toValue(viewport),
      app: useUpmind.config,
      brand: toValue(brand),
      category: toValue(category),
      product: toValue(product),
      optionGroup: toValue(optionGroup),
      option: toValue(option)
    })
  );

  const ui = computed(() => items.value.meta);
  const data = computed(() => items.value.data);

  function withScopes(extendOptions: WithMetaOptions): UseMetaResult {
    return useConfig({
      context,
      category: extendOptions.category ?? category,
      product,
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
