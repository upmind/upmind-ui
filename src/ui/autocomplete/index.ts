// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Autocomplete } from "./Autocomplete.ce.vue";
export * from "./types";

// --- custom elements
import Autocomplete from "./Autocomplete.ce.vue";
export const UwAutocomplete = defineCustomElement(Autocomplete);

// ---
