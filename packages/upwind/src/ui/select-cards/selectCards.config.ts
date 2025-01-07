import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../input/input.config";

export const triggerVariants = cva(
  "h-auto min-h-10 justify-start rounded-md py-3 text-left !text-primary",
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
  "hover:bg-control-active-muted flex items-start space-x-2 rounded-lg transition-all duration-300",
  {
    variants: {
      collapsible: {
        false: "border-b border-b-control last:border-b-0",
        true: "border border-t-0 border-control",
      },
      separate: {
        true: "border border-control",
      },
    },
  }
);

export const contentVariants = cva("!w-[--radix-popover-trigger-width] p-0", {
  variants: {
    separate: {
      true: "mt-2 flex flex-col gap-y-2",
    },
  },
});

export const groupVariants = cva("w-full", {
  variants: {
    collapsible: {
      true: "gap-0",
    },
  },
});

export default {
  select: {
    root: cva(`${ringClasses} ${invalidRingClasses} w-full rounded-md`),
    content: contentVariants,
    trigger: triggerVariants,
    item: itemVariants,
    group: groupVariants,
    items: cva("gap-0"),
    label: cva(
      "m-0 h-full w-full cursor-pointer rounded-md px-2 py-3 text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    ),
    input: cva("my-3 ml-3 mr-1 bg-control leading-normal text-control-active"),
  },
};
