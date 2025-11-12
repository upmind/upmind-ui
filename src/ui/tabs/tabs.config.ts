import { cva } from "class-variance-authority";

export const tabsRootVariants = cva(
  "relative flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  {
    variants: {
      overflow: {
        hidden: "overflow-x-auto overflow-y-hidden",
        visible: ""
      },
      hasBorder: {
        true: "border-surface mb-9 border-b",
        false: ""
      },
      align: {
        left: "justify-start",
        center: "justify-center",
        between: "justify-between",
        right: "justify-end"
      }
    },
    defaultVariants: {
      align: "left",
      hasBorder: true,
      overflow: "hidden"
    }
  }
);

export const tabsListVariants = cva(
  "inline-flex items-center justify-start gap-6 rounded-none p-0"
);

export const tabsTriggerVariants = cva(
  "text-md-tight hover:text-display data-[state=active]:text-display text-muted focus-visible:ring-control-ring focus-visible:ring-offset-core-surface relative inline-flex items-center gap-2 p-0 pb-4 text-base font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
);

export const tabsIndicatorVariants = cva(
  "bg-control-checked absolute bottom-0 left-0 h-[2px] transition-all duration-300 ease-in-out"
);

export default {
  tabs: {
    root: tabsRootVariants,
    list: tabsListVariants,
    trigger: tabsTriggerVariants,
    indicator: tabsIndicatorVariants,
    prepend: cva("pb-4"),
    append: cva("pb-4")
  }
};
