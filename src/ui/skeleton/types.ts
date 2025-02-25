// --- external
import type { CxOptions } from "class-variance-authority";
import type { HTMLAttributes } from "vue";

// --- types
export interface SkeletonProps {
  // --- styles
  uiConfig?: { skeleton: CxOptions };
  class?: HTMLAttributes["class"];
}
