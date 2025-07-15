import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../../assets/styles";

export const triggerVariants = cva(
  `flex h-auto min-w-0 items-center justify-start rounded-lg border-control px-3 py-2 text-left font-medium shadow-none`,
  {
    variants: {
      width: {
        xs: "!w-dropdown-xs",
        sm: "!w-dropdown-sm",
        md: "!w-dropdown-md",
        lg: "!w-dropdown-lg",
        xl: "!w-dropdown-xl",
        "2xl": "!w-dropdown-2xl",
        full: "w-full",
        auto: "w-auto",
        app: "w-app"
      }
    },
    defaultVariants: {
      width: "full"
    }
  }
);

export const itemVariants = cva(
  "hover:bg-control-active-focus focus:bg-control-active-focus m-0 flex h-full w-full cursor-pointer items-start space-x-2 rounded-lg px-3 py-2 text-md font-medium leading-none first:rounded-t-md last:rounded-b-md last:border-b-0 focus:outline-none"
);

export const contentVariants = cva(
  `bg-control-background ${ringClasses} ${invalidRingClasses} mt-2 flex max-h-72 !w-[--radix-dropdown-menu-trigger-width] flex-col overflow-hidden overflow-y-scroll rounded-lg border border-control p-1`,
  {
    variants: {
      width: {
        xs: "w-dropdown-xs",
        sm: "w-dropdown-sm",
        md: "w-dropdown-md",
        lg: "w-dropdown-lg",
        xl: "w-dropdown-xl",
        "2xl": "w-dropdown-2xl",
        full: "w-full",
        auto: "w-auto",
        app: "w-app"
      }
    },
    defaultVariants: {
      width: "full"
    }
  }
);

const groupVariants = cva(
  `${ringClasses} ${invalidRingClasses} w-full rounded-lg transition-all duration-200`
);

export default {
  select: {
    content: contentVariants,
    trigger: triggerVariants,
    item: itemVariants,
    items: cva("w-full gap-0"),
    group: groupVariants,
    input: cva("my-3 ml-3 mr-1 bg-control leading-normal text-control-active")
  }
};
