// --- external
import { type HTMLAttributes } from "vue";
import type { CxOptions } from "class-variance-authority";
import type { TabsRootProps, TabsListProps } from "radix-vue";

export interface TabItem {
  label: string;
  value: string;
  icon?: string;
  eager?: boolean;
}

export interface TabsProps extends TabsRootProps, TabsListProps {
  tabs: TabItem[];
  defaultValue?: string;
  border?: boolean;
  force?: boolean;
  // ---
  uiConfig?: {
    tabs: {
      trigger: CxOptions;
      list: CxOptions;
    };
  };
  class?: HTMLAttributes["class"];
}
