import { defineCustomElement } from "vue";
import Label from "./Label.ce.vue";

export { default as Label } from "./Label.ce.vue";
export { type LabelProps } from "./types";

export const UpmLabel = defineCustomElement(Label);
