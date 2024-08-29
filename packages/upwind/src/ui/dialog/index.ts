// --- external
import { defineCustomElement } from "vue";

// --- components
export { default as UwDialogConsolidated } from "./Dialog.ce.vue";

// -- custom elements
import DialogCE from "./Dialog.ce.vue";
export const UwDialog = defineCustomElement(DialogCE);

// -- custom elements
import DialogCloseCE from "./DialogClose.ce.vue";
export const UwDialogClose = defineCustomElement(DialogCloseCE);
