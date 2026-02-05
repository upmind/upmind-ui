// --- external
import { defineCustomElement } from "vue";
// --- internal
import NumberField from "./NumberField.ce.vue";

// export { default as NumberFieldRoot } from "./NumberField.vue";
// export { default as NumberFieldInput } from "./NumberFieldInput.vue";
// export { default as NumberFieldIncrement } from "./NumberFieldIncrement.vue";
// export { default as NumberFieldDecrement } from "./NumberFieldDecrement.vue";
// export { default as NumberFieldContent } from "./NumberFieldContent.vue";

export { default as NumberField } from "./NumberField.ce.vue";
export { type NumberFieldProps } from "./types";

export const UpmNumberField = defineCustomElement(NumberField);
