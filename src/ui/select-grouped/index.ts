import { defineCustomElement } from "vue";
import SelectGrouped from "./SelectGrouped.ce.vue";

export { default as SelectGrouped } from "./SelectGrouped.ce.vue";

export const UpmSelectGrouped = defineCustomElement(SelectGrouped);

export * from "./utils";

export * from "./types";
