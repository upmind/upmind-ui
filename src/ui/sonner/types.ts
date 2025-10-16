// --- external
import type { CxOptions } from "class-variance-authority";
import { type HTMLAttributes } from "vue";
import { type ToasterProps } from "vue-sonner";

// --- types
import { TOAST_VARIANTS } from ".";

export interface SonnerProps extends ToasterProps {
  variant?: typeof TOAST_VARIANTS;
  // ---
  uiConfig?: { sonner: CxOptions };
  class?: HTMLAttributes["class"];
}
