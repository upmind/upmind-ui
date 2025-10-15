// --- external
import type { CxOptions } from "class-variance-authority";
import { type HTMLAttributes } from "vue";
import { type ToasterProps } from "vue-sonner";
import { parseVariants } from "../../utils";

export interface SonnerProps extends ToasterProps {
  variant?: typeof MESSAGE_VARIANTS;
  // ---
  uiConfig?: { sonner: CxOptions };
  class?: HTMLAttributes["class"];
}

import config from "./sonner.config";
export const MESSAGE_VARIANTS = parseVariants(config.sonner);
