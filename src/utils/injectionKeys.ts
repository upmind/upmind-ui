import type { ComputedRef, InjectionKey } from "vue";

export const ICON_VARIANT_KEY: InjectionKey<ComputedRef<string>> = Symbol(
  "UPMIND.UI.ICON.VARIANT"
);
