import type { HTMLAttributes } from "vue";

export type MarkdownProps = {
  class?: HTMLAttributes["class"];
  tag?: string;
  modelValue?: string;
  keys?: Record<string, string>;
  inline?: boolean;
};

export const INLINE_TAGS = [
  "a",
  "b",
  "i",
  "em",
  "strong",
  "big",
  "small",
  "br",
  "span"
];

export const INLINE_ATTRS = ["href", "target", "rel", "title"];
