import { registerEntry } from "@upmind/ui";
import { shallowReactive } from "vue";
import {
  MissingControlRenderer,
  missingControlTester
} from "./MissingControlRenderer";
import { forEach } from "lodash-es";
import type { FormRendererEntry, UseFormRenderers } from "./types";

const registry = shallowReactive<FormRendererEntry[]>([]);

/** Adds a package's form controls to every `Form`; call it from the package entry. */
export const registerFormRenderers = (entries: FormRendererEntry[]): void => {
  forEach(entries, entry => {
    registry.push(entry);
  });
};

if (import.meta.env.DEV) {
  registerFormRenderers([
    registerEntry(MissingControlRenderer, missingControlTester)
  ]);
}

export const useFormRenderers = (): UseFormRenderers => ({
  renderers: registry
});
