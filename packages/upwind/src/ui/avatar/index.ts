// --- external
import { defineCustomElement } from "vue";

// -- components
export { default as AvatarImage } from "./AvatarImage.vue";
export { default as AvatarFallback } from "./AvatarFallback.vue";

// --- custom elements
import AvatarCE from "./Avatar.ce.vue";
export const UwAvatar = defineCustomElement(AvatarCE);
