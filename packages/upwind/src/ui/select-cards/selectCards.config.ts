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
  `hover:bg-control-active-muted focus:bg-control-active-focus flex w-full items-start space-x-2 focus:outline-none`,
  {
    variants: {
      variant: {
        dropdown:
          "rounded-none border-b border-b-control first:rounded-t-md last:rounded-b-md last:border-b-0",
        collapsible:
          "border border-t-0 border-control first:pt-1 last:rounded-b-md",
      },
    },
  }
);

export const contentVariants = cva(``, {
  variants: {
    variant: {
      dropdown: `bg-control-background ${ringClasses} ${invalidRingClasses} mt-2 flex max-h-72 !w-[--radix-dropdown-menu-trigger-width] flex-col overflow-hidden overflow-y-scroll rounded-md border border-control shadow-sm`,
      collapsible: "-mt-1",
    },
  },
});

const groupVariants = cva("w-full", {
  variants: {
    variant: {
      dropdown: "",
      collapsible: `${ringClasses} ${invalidRingClasses} rounded-md transition-all duration-200`,
    },
  },
});

export default {
  select: {
    root: cva(``),
    content: contentVariants,
    trigger: triggerVariants,
    item: itemVariants,
    items: cva("w-full gap-0"),
    label: cva(
      "m-0 h-full w-full cursor-pointer rounded-md px-4 py-3 text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    ),
    group: groupVariants,
    input: cva("my-3 ml-3 mr-1 bg-control leading-normal text-control-active"),
  },
};
