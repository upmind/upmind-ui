import type { ComputedRef, InjectionKey } from "vue";

export const ICON_VARIANT_KEY: InjectionKey<ComputedRef<string>> = Symbol(
  "UPMIND.UI.ICON.VARIANT"
);

export const ICON_STROKE_KEY: InjectionKey<ComputedRef<string>> = Symbol(
  "UPMIND.UI.ICON.STROKE"
);
