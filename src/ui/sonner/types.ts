// --- external
import type { TOAST_VARIANTS } from ".";
import type { CxOptions } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
import type { ToasterProps } from "vue-sonner";
// --- types

export interface SonnerProps extends ToasterProps {
  variant?: typeof TOAST_VARIANTS;
  // ---
  uiConfig?: { sonner: CxOptions };
  class?: HTMLAttributes["class"];
}
