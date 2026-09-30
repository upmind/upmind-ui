import { shallowRef } from "vue";
import { concat } from "lodash-es";
import type { FormRendererEntry, UseFormRenderers } from "./types";

const renderers = shallowRef<FormRendererEntry[]>([]);

/** Adds a package's form controls to every `Form`; call it from the package entry. */
export const registerFormRenderers = (entries: FormRendererEntry[]): void => {
  renderers.value = concat(renderers.value, entries);
};

export const useFormRenderers = (): UseFormRenderers => ({ renderers });
