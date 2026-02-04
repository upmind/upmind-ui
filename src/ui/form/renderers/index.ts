// export * from "./array";
// export * from "./complex";
export * from "./controls";
export * from "./layouts";
export * from "./utils";
export * from "./label";
// ---

import { arrayRenderers } from "./array";
import { complexRenderers } from "./complex";
import { controlRenderers } from "./controls";
import { labelRenderers } from "./label";
import { layoutRenderers } from "./layouts";

export const upmindUIRenderers = [
  ...controlRenderers,
  ...layoutRenderers,
  ...arrayRenderers,
  ...complexRenderers,
  ...labelRenderers
];
