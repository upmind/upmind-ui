import { defineCustomElement } from "vue";
import Dialog from "./Dialog.ce.vue";
import { variants } from "./dialog.config";
import { keys } from "lodash-es";

export { default as Dialog } from "./Dialog.ce.vue";
export { default as DialogClose } from "./DialogClose.vue";
export { type DialogProps } from "./types";

export const UpmDialog = defineCustomElement(Dialog);

export const DIALOG_SIZES = keys(variants.size);
export const DIALOG_OVERFLOWS = keys(variants.overflow);
export const DIALOG_FITS = keys(variants.fit);
