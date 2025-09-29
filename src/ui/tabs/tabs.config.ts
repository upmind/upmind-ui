import { cva } from "class-variance-authority";

export const variants = {
  alignment: {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly"
  },
  width: {
    full: "w-full",
    auto: "w-auto"
  }
};

export const tabsListVariants = cva(
  "text-muted-foreground shadow-border-border-control-default bg-background-control-surface text-base-foreground mb-6 inline-flex items-center rounded p-0",
  {
    variants,
    defaultVariants: {
      alignment: "evenly",
      width: "auto"
    }
  }
);

export const tabsTriggerVariants = cva(
  "text-md data-[state=active]:shadow-border-border-control-selected data-[state=active]:text-text-display hover:text-text-display text-text-muted relative inline-flex cursor-pointer items-center justify-center rounded px-8 py-2 font-medium whitespace-nowrap"
);

export default {
  tabs: {
    list: tabsListVariants,
    trigger: tabsTriggerVariants
  }
};
