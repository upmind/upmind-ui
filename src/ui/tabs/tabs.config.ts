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
  "text-muted-foreground shadow-control-default bg-control-surface control-radius mb-6 inline-flex items-center p-0 text-base",
  {
    variants,
    defaultVariants: {
      alignment: "evenly",
      width: "auto"
    }
  }
);

export const tabsTriggerVariants = cva(
  "text-md data-[state=active]:shadow-control-selected data-[state=active]:text-display hover:text-display text-muted control-radius relative inline-flex cursor-pointer items-center justify-center px-8 py-2 font-medium whitespace-nowrap"
);

export default {
  tabs: {
    list: tabsListVariants,
    trigger: tabsTriggerVariants
  }
};
