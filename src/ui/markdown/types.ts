import type { HTMLAttributes } from "vue";
export type MarkdownProps = {
  class?: HTMLAttributes["class"];
  tag?: string;
  modelValue?: string;
  keys?: Record<string, string>;
};
