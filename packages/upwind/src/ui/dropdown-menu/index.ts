// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as DropdownMenu } from "./DropdownMenu.ce.vue";
export { type DropdownMenuProps, type DropdownMenuItem } from "./types";

// --- custom elements
import DropdownMenu from "./DropdownMenu.ce.vue";
export const UwDropdownMenu = defineCustomElement(DropdownMenu);

// ---
