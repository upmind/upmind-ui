import type { CxOptions } from "class-variance-authority";
import type { HTMLAttributes } from "vue";

export interface DescriptionListProps {
  items?: DescriptionItem[];
  // ---
  uiConfig?: { descriptionList: CxOptions };
  class?: HTMLAttributes["class"];
}

export interface DescriptionItem {
  term: string;
  description: string;
}
