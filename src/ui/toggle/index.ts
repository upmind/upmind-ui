import { defineCustomElement } from "vue";
import Toggle from "./Toggle.ce.vue";

export { default as Toggle } from "./Toggle.ce.vue";
export { type ToggleProps } from "./types";

export const UpmToggle = defineCustomElement(Toggle);
