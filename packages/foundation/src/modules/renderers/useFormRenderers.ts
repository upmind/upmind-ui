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

/**
 * The renderers a form host injects in place of the `additionalRenderers` prop.
 * Reads an empty set when no host provided one.
 */
export const useFormRenderers = (): UseFormRenderers => ({
  renderers: hasInjectionContext() ? inject(FORM_RENDERERS, []) : []
});
