// --- external
import { type HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";
import type {
  TabsRootProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
} from "radix-vue";

// --- internal
import type { tabsListVariants, tabsTriggerVariants } from "./tabs.config";
type TabsTriggerVariantProps = VariantProps<typeof tabsTriggerVariants>;
type TabsListVariantProps = VariantProps<typeof tabsListVariants>;

export interface TabItems {
  label: string;
  value: string;
}

export interface TabsProps
  extends TabsRootProps,
    TabsContentProps,
    TabsTriggerProps,
    TabsListProps {
  tabs: TabItems[];
  defaultValue?: string;
  // ---
  variant?:
    | TabsTriggerVariantProps["variant"]
    | TabsListVariantProps["variant"];
  color?: TabsTriggerVariantProps["color"] | TabsListVariantProps["color"];
  alignment?: TabsListVariantProps["alignment"];
  width?: TabsListVariantProps["width"];
  // ---
  upwindConfig?: {
    tabs: {
      trigger: VariantProps<typeof tabsTriggerVariants>;
      list: VariantProps<typeof tabsListVariants>;
    };
  };
  class?: HTMLAttributes["class"];
}
