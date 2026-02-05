// -----------------------------------------------------------------------------
import ObjectRenderer, { tester as objectTest } from "./ObjectRenderer.vue";
import OneOfRenderer, { tester as oneOfTest } from "./OneOfRenderer.vue";
import { registerEntry } from "../utils";

export const complexRenderers = [
  registerEntry(ObjectRenderer, objectTest),
  registerEntry(OneOfRenderer, oneOfTest)
];
