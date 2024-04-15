export * from "./array";
export * from "./controls";
export * from "./layouts";
export * from "./styles";
export * from "./utils";
export * from "./label";

// ---

import { arrayRenderers } from "./array";
import { controlRenderers } from "./controls";
import { labelRenderers } from "./label";
import { layoutRenderers } from "./layouts";

export const upwindRenderers = [
  ...controlRenderers,
  ...layoutRenderers,
  ...arrayRenderers,
  ...labelRenderers,
];
