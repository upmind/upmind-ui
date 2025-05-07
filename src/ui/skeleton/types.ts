// --- external
import type { CxOptions } from "class-variance-authority";
import type { HTMLAttributes } from "vue";

// --- types
export interface SkeletonProps {
  // --- styles
  uiConfig?: { skeleton: CxOptions };
  class?: HTMLAttributes["class"];
}

export interface SkeletonListProps {
  rows?: number;
  // --- styles
  uiConfig?: { skeletonList: CxOptions };
  class?: HTMLAttributes["class"];
}
