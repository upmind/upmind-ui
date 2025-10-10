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
  "inline-flex items-center gap-6 p-0 text-base",
  {
    variants,
    defaultVariants: {
      alignment: "start",
      width: "auto"
    }
  }
);

export const tabsTriggerVariants = cva(
  "text-md/tight text-muted data-[state=active]:shadow-tab-b-control-selected relative inline-flex cursor-pointer items-center justify-center rounded-none px-0 pt-0 pb-4 font-medium whitespace-nowrap transition-all duration-200 hover:text-base data-[state=active]:text-base"
);

export default {
  tabs: {
    list: tabsListVariants,
    trigger: tabsTriggerVariants
  }
};
