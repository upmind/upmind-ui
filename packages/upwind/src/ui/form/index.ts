// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Form } from "./Form.ce.vue";
export { default as FormField } from "./FormField.vue";

export { default as FormItem } from "./FormItem.vue";
export { default as FormLabel } from "./FormLabel.vue";
export { default as FormControl } from "./FormControl.vue";
export { default as FormMessage } from "./FormMessage.vue";
export { default as FormDescription } from "./FormDescription.vue";
export { default as FormRequiredIndicator } from "./FormRequiredIndicator.vue";
export { default as FormLabelGroup } from "./FormLabelGroup.vue";

// --- types
export * from "./types";

// --- custom elements
import FormCE from "./Form.ce.vue";
export const UwForm = defineCustomElement(FormCE);
