import { cva } from "class-variance-authority";

export const tabsListVariants = cva(
  "border-surface relative mb-4 inline-flex w-full items-center justify-start gap-6 overflow-x-auto overflow-y-hidden rounded-none border-b px-0 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
);

export const tabsTriggerVariants = cva(
  "text-md/tight hover:text-display data-[state=active]:text-display text-muted focus-visible:ring-control-ring focus-visible:ring-offset-core-surface relative inline-flex items-center gap-2 p-0 text-base font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
);

export const tabsIndicatorVariants = cva(
  "bg-control-checked absolute bottom-0 left-0 h-[2px] transition-all duration-300 ease-in-out"
);

export default {
  tabs: {
    list: tabsListVariants,
    trigger: tabsTriggerVariants,
    indicator: tabsIndicatorVariants
  }
};
