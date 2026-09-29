import { hasInjectionContext, inject } from "vue";
import type { FormRendererEntry, UseFormRenderers } from "./renderer.types";
import type { InjectionKey } from "vue";

export const FORM_RENDERERS: InjectionKey<FormRendererEntry[]> = Symbol(
  "upmind-form-renderers"
);

export const useFormRenderers = (): UseFormRenderers => ({
  renderers: hasInjectionContext() ? inject(FORM_RENDERERS, []) : []
});
