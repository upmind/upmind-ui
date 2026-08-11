import type { ToggleVariantProps } from "../toggle/types";
import type { CxOptions } from "class-variance-authority";
import type { ToggleGroupRootProps } from "radix-vue";
import type { HTMLAttributes } from "vue";

/** One selectable position. `label` is already translated by the consumer. */
export type ToggleGroupItem = {
  value: string;
  label?: string;
  icon?: string;
  disabled?: boolean;
  dataAttrs?: Record<`data-${string}`, string | number | boolean>;
  class?: HTMLAttributes["class"];
};

export type ToggleGroupProps = ToggleGroupRootProps & {
  // --- props
  items?: ToggleGroupItem[];
  // --- variants
  variant?: ToggleVariantProps["variant"];
  size?: ToggleVariantProps["size"];
  // --- styles
  uiConfig?: { toggleGroup: { root: CxOptions; item: CxOptions } };
  class?: HTMLAttributes["class"];
  classItem?: HTMLAttributes["class"];
};
