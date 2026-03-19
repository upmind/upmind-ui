// --- external
import { defineCustomElement } from "vue";
// --- vue elements
export { default as IconAnimated } from "./IconAnimated.ce.vue";
export { type AnimatedIconProps, type AnimationImportMap } from "./types";
export { loadAnimation } from "./utils/animationLoader";
// --- animation loader utilities
export {
  registerAnimations,
  hasRegisteredAnimations,
  getAnimationCount
} from "./utils/animationLoader";
// --- custom elements
import IconAnimated from "./IconAnimated.ce.vue";

export const UpmIconAnimated = defineCustomElement(IconAnimated);
