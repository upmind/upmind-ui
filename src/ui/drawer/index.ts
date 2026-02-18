import { defineCustomElement } from "vue";
import DrawerCE from "./Drawer.ce.vue";

export { default as Drawer } from "./Drawer.ce.vue";

export const UpmDrawer = defineCustomElement(DrawerCE);
