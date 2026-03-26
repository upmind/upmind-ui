// --- external
import { defineCustomElement } from "vue";
// --- vue elements
export { default as Interstitial } from "./Interstitial.ce.vue";
export { Slot } from "radix-vue";
export * from "./types";
// --- custom elements
import Interstitial from "./Interstitial.ce.vue";

export const UpmInterstitial = defineCustomElement(Interstitial);
