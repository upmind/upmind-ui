import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../../assets/ring.styles";

export const triggerVariants = cva(
  `shadow-border group flex h-auto min-w-0 items-center justify-start rounded px-4 py-2 text-left font-medium`,
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
  "hover:bg-control-active-focus focus:bg-control-active-focus text-md m-0 flex h-full w-full cursor-pointer items-start space-x-2 rounded px-3 py-2 leading-none font-medium first:rounded-t-md last:rounded-b-md last:border-b-0 focus:outline-none"
);

export const contentVariants = cva(
  `bg-control-background ${ringClasses} ${invalidRingClasses} border-control mt-2 flex max-h-72 w-(--radix-dropdown-menu-trigger-width)! flex-col overflow-hidden overflow-y-scroll rounded border p-1`,
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
  `${ringClasses} ${invalidRingClasses} w-full rounded transition-all duration-200`
);

export default {
  select: {
    content: contentVariants,
    trigger: triggerVariants,
    item: itemVariants,
    items: cva("w-full gap-0"),
    group: groupVariants,
    input: cva(
      "bg-control-background text-control-active my-3 mr-1 ml-3 leading-normal"
    )
  }
};
