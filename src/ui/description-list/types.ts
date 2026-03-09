// --- external
import type { CxOptions } from "class-variance-authority";
import type { HTMLAttributes } from "vue";

export type DescriptionListProps = {
  items?: DescriptionItem[];
  // ---
  uiConfig?: { descriptionList: CxOptions };
  class?: HTMLAttributes["class"];
};

export type DescriptionItem = {
  term: string;
  description: string;
};
