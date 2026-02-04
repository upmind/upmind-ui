// --- external
import { defineCustomElement } from "vue";
// --- vue elements
export { default as Loading } from "./Loading.ce.vue";
// --- custom elements
import Loading from "./Loading.ce.vue";

export const UpmLoading = defineCustomElement(Loading);
