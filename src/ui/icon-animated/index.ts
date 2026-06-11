export { default as IconAnimated } from "./IconAnimated.ce.vue";
export { type AnimatedIconProps, type AnimationImportMap } from "./types";
export { loadAnimation } from "./utils/animationLoader";
// --- animation loader utilities
export {
  registerAnimations,
  hasRegisteredAnimations,
  getAnimationCount
} from "./utils/animationLoader";
