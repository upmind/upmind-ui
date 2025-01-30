import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../../assets/styles";

export const triggerVariants = cva(
  `h-auto min-h-10 w-full min-w-0 items-center justify-start rounded-md border-control px-4 py-3 text-left font-medium !text-primary`,
  {
    variants: {
      width: {
        full: "w-full",
        auto: "w-auto",
        app: "w-app",
      },
    },
    defaultVariants: {
      width: "full",
    },
  }
);

export const itemVariants = cva(
  "hover:bg-control-active-muted focus:bg-control-active-focus m-0 flex h-full w-full cursor-pointer items-start space-x-2 rounded-none border-b border-b-control px-4 py-3 text-md font-medium leading-none first:rounded-t-md last:rounded-b-md last:border-b-0 focus:outline-none"
);

export const contentVariants = cva(
  `bg-control-background ${ringClasses} ${invalidRingClasses} mt-2 flex max-h-72 !w-[--radix-dropdown-menu-trigger-width] flex-col overflow-hidden overflow-y-scroll rounded-md border border-control shadow-sm`
);

const groupVariants = cva(
  `${ringClasses} ${invalidRingClasses} w-full rounded-md transition-all duration-200`
);

export default {
  select: {
    content: contentVariants,
    trigger: triggerVariants,
    item: itemVariants,
    items: cva("w-full gap-0"),
    group: groupVariants,
    input: cva("my-3 ml-3 mr-1 bg-control leading-normal text-control-active"),
  },
};
