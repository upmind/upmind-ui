import { cva } from "class-variance-authority";

export const variants = {
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
  },
  variant: {
    minimal: "items-end",
    block: "items-center"
  }
};

export const tabsRootVariants = cva(
  "relative flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  {
    variants,
    defaultVariants: {
      align: "left",
      hasBorder: true,
      overflow: "hidden",
      variant: "minimal"
    }
  }
);

export const tabsListVariants = cva(
  "inline-flex items-center justify-start rounded-none p-0",
  {
    variants: {
      variant: {
        minimal: "gap-6",
        block: "gap-2"
      }
    },
    defaultVariants: {
      variant: "minimal"
    }
  }
);

export const tabsTriggerVariants = cva(
  "text-md-tight focus-visible:ring-control-ring focus-visible:ring-offset-core-surface relative inline-flex items-center gap-2 text-base font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        minimal:
          "hover:text-display data-[state=active]:text-display text-muted p-0 pb-4",
        block:
          "control-radius bg-control-surface shadow-control-default text-muted data-[state=active]:bg-primary data-[state=active]:text-accent-primary-contrast hover:shadow-control-hover px-4 py-2 data-[state=active]:shadow-none data-[state=active]:hover:shadow-none"
      }
    },
    defaultVariants: {
      variant: "minimal"
    }
  }
);

export const tabsIndicatorVariants = cva(
  "bg-control-checked absolute bottom-0 left-0 h-[2px] transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        minimal: "",
        block: "hidden"
      }
    },
    defaultVariants: {
      variant: "minimal"
    }
  }
);

export default {
  tabs: {
    root: tabsRootVariants,
    list: tabsListVariants,
    trigger: tabsTriggerVariants,
    indicator: tabsIndicatorVariants,
    icon: cva(""),
    prepend: cva("pb-4"),
    append: cva("pb-4")
  }
};
