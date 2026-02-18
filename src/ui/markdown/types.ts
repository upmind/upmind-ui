import type { HTMLAttributes } from "vue";
export interface MarkdownProps {
  class?: HTMLAttributes["class"];
  tag?: string;
  modelValue?: string;
  keys?: Record<string, string>;
}
