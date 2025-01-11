// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Dialog } from "./Dialog.ce.vue";
export { default as DialogClose } from "./DialogClose.vue";
export { type DialogProps } from "./types";

// --- custom elements
import Dialog from "./Dialog.ce.vue";
export const UpmDialog = defineCustomElement(Dialog);
