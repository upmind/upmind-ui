// --- external
import { type HTMLAttributes } from "vue";
import { type InputProps as RootInputProps } from "radix-vue";
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { inputVariants } from "./input.config";
type InputVariantProps = VariantProps<typeof inputVariants>;

export interface InputProps extends RootInputProps {
  // ---
  upwindConfig?: { input: Partial<InputVariantProps> };
  class?: HTMLAttributes["class"];
}
