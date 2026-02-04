// --- external
import { defineCustomElement } from "vue";
// --- vue elements
export { default as Icon } from "./Icon.ce.vue";
export { type IconProps, type IconImportMap } from "./types";
// --- icon loader utilities
export {
  registerIcons,
  hasRegisteredIcons,
  getIconCount
} from "./utils/iconLoader";
// --- custom elements
import Icon from "./Icon.ce.vue";

export const UpmIcon = defineCustomElement(Icon);
