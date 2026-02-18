import { defineCustomElement } from "vue";
import IconAnimated from "./IconAnimated.ce.vue";

export { default as IconAnimated } from "./IconAnimated.ce.vue";
export { type AnimatedIconProps, type AnimationImportMap } from "./types";
// --- animation loader utilities
export {
  registerAnimations,
  hasRegisteredAnimations,
  getAnimationCount
} from "./utils/animationLoader";

export const UpmIconAnimated = defineCustomElement(IconAnimated);
