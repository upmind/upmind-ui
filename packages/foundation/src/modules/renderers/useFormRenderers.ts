import { computed, hasInjectionContext, inject, provide } from "vue";
import { rendererEntries } from "./renderer.registry";
import type { FormRendererEntry } from "./renderer.types";
import type { ComputedRef, InjectionKey } from "vue";

export const FORM_RENDERERS: InjectionKey<ComputedRef<FormRendererEntry[]>> =
  Symbol("upmind-form-renderers");

export const provideFormRenderers = (
  renderers: ComputedRef<FormRendererEntry[]>
) => provide(FORM_RENDERERS, renderers);

export type UseFormRenderers = {
  renderers: ComputedRef<FormRendererEntry[]>;
};

/**
 * The renderers a form host injects in place of the `additionalRenderers` prop.
 * Reads the registry unless a host provides its own set.
 */
export const useFormRenderers = (): UseFormRenderers => {
  const provided = hasInjectionContext() ? inject(FORM_RENDERERS, null) : null;

  return {
    renderers: computed(() => provided?.value ?? rendererEntries.value)
  };
};
