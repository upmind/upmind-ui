// --- external
import type { CxOptions } from "class-variance-authority";
import { type HTMLAttributes } from "vue";
import { type ToasterProps } from "vue-sonner";

// --- internal
export interface SonnerProps extends ToasterProps {
  // ---
  uiConfig?: { sonner: CxOptions };
  class?: HTMLAttributes["class"];
}
