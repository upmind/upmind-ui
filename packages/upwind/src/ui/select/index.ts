// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Select } from "./Select.ce.vue";

export { default as SelectRoot } from "./Select.vue";
export { default as SelectValue } from "./SelectValue.vue";
export { default as SelectTrigger } from "./SelectTrigger.vue";
export { default as SelectContent } from "./SelectContent.vue";
export { default as SelectGroup } from "./SelectGroup.vue";
export { default as SelectItem } from "./SelectItem.vue";
export { default as SelectItemText } from "./SelectItemText.vue";
export { default as SelectLabel } from "./SelectLabel.vue";
export { default as SelectSeparator } from "./SelectSeparator.vue";
export { default as SelectScrollUpButton } from "./SelectScrollUpButton.vue";
export { default as SelectScrollDownButton } from "./SelectScrollDownButton.vue";

export { type SelectProps } from "./types";

// --- custom elements
import Select from "./Select.ce.vue";
export const UwSelect = defineCustomElement(Select);
