import { hasInjectionContext, inject, provide } from "vue";
import type { FormRendererEntry } from "./renderer.types";
import type { InjectionKey } from "vue";

export const FORM_RENDERERS: InjectionKey<FormRendererEntry[]> = Symbol(
  "upmind-form-renderers"
);

export const provideFormRenderers = (renderers: FormRendererEntry[]) =>
  provide(FORM_RENDERERS, renderers);

export type UseFormRenderers = {
  renderers: FormRendererEntry[];
};

export const useFormRenderers = (): UseFormRenderers => ({
  renderers: hasInjectionContext() ? inject(FORM_RENDERERS, []) : []
});
