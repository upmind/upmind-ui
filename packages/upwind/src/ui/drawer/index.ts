// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Drawer } from "./Drawer.ce.vue";

// --- custom elements
import DrawerCE from "./Drawer.ce.vue";
export const UwDrawer = defineCustomElement(DrawerCE);
