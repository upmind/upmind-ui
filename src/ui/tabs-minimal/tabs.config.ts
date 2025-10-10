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
  "text-muted-foreground inline-flex items-center p-0 text-base border-b border-border",
  {
    variants,
    defaultVariants: {
      alignment: "start",
      width: "auto"
    }
  }
);

export const tabsTriggerVariants = cva(
  "text-md relative inline-flex cursor-pointer items-center justify-center px-4 py-3 font-medium whitespace-nowrap transition-colors border-b-2 border-transparent hover:text-foreground data-[state=active]:text-primary data-[state=active]:border-primary"
);

export default {
  tabs: {
    list: tabsListVariants,
    trigger: tabsTriggerVariants
  }
};
