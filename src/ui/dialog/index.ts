// --- external
import { defineCustomElement } from "vue";
import { keys } from "lodash-es";
// --- vue elements
export { default as Dialog } from "./Dialog.ce.vue";
export { default as DialogClose } from "./DialogClose.vue";
export { type DialogProps } from "./types";
// --- custom elements
import Dialog from "./Dialog.ce.vue";

export const UpmDialog = defineCustomElement(Dialog);
// --- types
import { variants } from "./dialog.config";

export const DIALOG_SIZES = keys(variants.size);
export const DIALOG_OVERFLOWS = keys(variants.overflow);
export const DIALOG_FITS = keys(variants.fit);
