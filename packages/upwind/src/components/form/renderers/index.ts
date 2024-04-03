export * from "./array";
export * from "./controls";
export * from "./layouts";
export * from "./styles";
export * from "./util";
export * from "./label";

// ---

import { arrayRenderers } from "./array";
import { controlRenderers } from "./controls";
import { labelRenderers } from "./label";
import { layoutRenderers } from "./layouts";

export const prelineRenderers = [
  ...controlRenderers,
  ...layoutRenderers,
  ...arrayRenderers,
  ...labelRenderers,
];
