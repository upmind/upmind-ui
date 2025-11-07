// --- external
import { type HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { TabsRootProps, TabsListProps } from "radix-vue";
import type { tabsRootVariants } from "./tabs.config";
type TabsRootVariantsProps = VariantProps<typeof tabsRootVariants>;

export interface TabItem {
  label: string;
  value: string;
  icon?: string;
  eager?: boolean;
}

export interface TabsProps extends TabsRootProps, TabsListProps {
  tabs: TabItem[];
  defaultValue?: string;
  force?: boolean;
  // ---
  border?: boolean;
  align?: TabsRootVariantsProps["align"];
  overflow?: TabsRootVariantsProps["overflow"];
  // ---
  uiConfig?: {
    tabs: {
      root: CxOptions;
      trigger: CxOptions;
      list: CxOptions;
    };
  };
  class?: HTMLAttributes["class"];
}
