// --- external
import type { CxOptions } from "class-variance-authority";
import type { HTMLAttributes } from "vue";

export type DescriptionListProps = {
  items?: DescriptionItem[];
  // ---
  uiConfig?: { descriptionList: CxOptions };
  class?: HTMLAttributes["class"];
  dataAttrs?: Record<`data-${string}`, string | number | boolean>;
};

export type DescriptionItem = {
  term: string;
  description: string;
  dataAttrs?: Record<`data-${string}`, string | number | boolean>;
};
