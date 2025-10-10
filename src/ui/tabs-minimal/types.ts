// --- external
import { type HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type {
  TabsRootProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps
} from "radix-vue";

// --- internal
import type { tabsListVariants, tabsTriggerVariants } from "./tabs.config";
type TabsTriggerVariantProps = VariantProps<typeof tabsTriggerVariants>;
type TabsListVariantProps = VariantProps<typeof tabsListVariants>;

export interface TabItem {
  label: string;
  value: string;
  eager?: boolean;
}

export interface TabsProps extends TabsRootProps, TabsListProps {
  tabs: TabItem[];
  defaultValue?: string;
  // ---
  alignment?: TabsListVariantProps["alignment"];
  width?: TabsListVariantProps["width"];
  // ---
  uiConfig?: {
    tabs: {
      trigger: CxOptions;
      list: CxOptions;
    };
  };
  class?: HTMLAttributes["class"];
}
