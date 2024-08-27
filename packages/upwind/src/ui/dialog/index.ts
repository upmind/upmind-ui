// --- external
import { defineCustomElement } from "vue";

// --- components
export { default as Dialog } from "./Dialog.vue";
export { default as DialogTrigger } from "./DialogTrigger.vue";
export { default as DialogHeader } from "./DialogHeader.vue";
export { default as DialogTitle } from "./DialogTitle.vue";
export { default as DialogDescription } from "./DialogDescription.vue";
export { default as DialogScrollContent } from "./DialogScrollContent.vue";
export { default as DialogFooter } from "./DialogFooter.vue";
export { default as UwDialogClose } from "./DialogClose.vue";
export { default as UwDialogConsolidated } from "./Dialog.ce.vue";

// -- custom elements
import DialogCE from "./Dialog.ce.vue";
export const UwDialog = defineCustomElement(DialogCE);
