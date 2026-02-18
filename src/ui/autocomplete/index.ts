import { defineCustomElement } from "vue";
import Autocomplete from "./Autocomplete.ce.vue";

export { default as Autocomplete } from "./Autocomplete.ce.vue";
export * from "./types";

export const UpmAutocomplete = defineCustomElement(Autocomplete);
// ---
