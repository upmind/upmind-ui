// --- external
import type { CxOptions } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
// --- types
export type SkeletonProps = {
  active?: boolean;
  // --- styles
  uiConfig?: { skeleton: CxOptions };
  class?: HTMLAttributes["class"];
}

export type SkeletonListProps = {
  rows?: number;
  // --- styles
  uiConfig?: { skeletonList: CxOptions };
  class?: HTMLAttributes["class"];
}
