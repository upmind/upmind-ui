import { defineCustomElement } from "vue";
import Interstitial from "./Interstitial.ce.vue";

export { default as Interstitial } from "./Interstitial.ce.vue";
export * from "./types";

export const UpmInterstitial = defineCustomElement(Interstitial);
