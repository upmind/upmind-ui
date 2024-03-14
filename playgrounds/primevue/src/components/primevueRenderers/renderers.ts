import { arrayRenderers } from "./array";
import { controlRenderers } from "./controls";
import { labelRenderers } from "./label";
import { layoutRenderers } from "./layouts";

export const primevueRenderers = [
  ...controlRenderers,
  ...layoutRenderers,
  ...arrayRenderers,
  ...labelRenderers,
];
