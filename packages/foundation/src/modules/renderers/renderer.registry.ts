/**
 * @internal
 * The renderer registry of ADR 023 §2's registry-ownership invariant: it ships
 * EMPTY and every entry arrives from a contributing package's own `feature.ts`.
 * An entry declared here would make `foundation` import a domain package, and
 * since every domain package imports `foundation`, that is a typed cycle.
 */
import { shallowRef } from "vue";
import type { FormRendererEntry } from "./renderer.types";
import type { ShallowRef } from "vue";

// Annotated, not inferred: the entry shape resolves into `ui`'s JSONForms
// dependency, which foundation must not name in its own declaration output.
export const rendererEntries: ShallowRef<FormRendererEntry[]> = shallowRef([]);

export function addRenderers(added: FormRendererEntry[]): void {
  rendererEntries.value = rendererEntries.value.concat(added);
}

export function clearRenderers(): void {
  rendererEntries.value = [];
}
