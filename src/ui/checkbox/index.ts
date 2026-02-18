import { defineCustomElement } from "vue";
import Checkbox from "./Checkbox.ce.vue";

export { default as Checkbox } from "./Checkbox.ce.vue";
export { type CheckboxProps } from "./types";

export const UpmCheckbox = defineCustomElement(Checkbox);
