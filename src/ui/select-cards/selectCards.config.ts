import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../../assets/styles";

export const variants = {
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
};

export const triggerVariants = cva(
  `bg-control-surface [&:hover,&:focus-within,&[data-hover=true],&[data-focus=true]]:shadow-control-hover [&:focus-within,&[data-focus=true]]:ring-ring control-radius shadow-control-default group flex cursor-pointer border-none px-4 py-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 [&:focus-within,&[data-focus=true]]:ring-2 [&:focus-within,&[data-focus=true]]:ring-offset-2 ${ringClasses} ${invalidRingClasses} h-auto min-w-0 items-center justify-start text-left font-medium`,
  {
    variants,
    defaultVariants: {
      width: "full"
    }
  }
);

export const itemVariants = cva(
  "data-[state=unchecked]:text-muted control-radius data-[state=checked]:bg-control-selected text-muted data-[state=checked]:text-control-selected focus:hover:text-control-selected cursor-pointer gap-3 px-4 py-2 font-normal transition-all duration-200"
);

export const contentVariants = cva(
  `control-radius shadow-control-default bg-control-surface my-2 border-none ${ringClasses} ${invalidRingClasses} flex max-h-72 min-w-(--radix-dropdown-menu-trigger-width) flex-col overflow-hidden overflow-y-scroll p-2`,
  {
    variants,
    defaultVariants: {
      width: "full"
    }
  }
);

const groupVariants = cva(
  `${ringClasses} ${invalidRingClasses} control-radius w-full transition-all duration-200`
);

export default {
  select: {
    content: contentVariants,
    trigger: triggerVariants,
    item: itemVariants,
    items: cva("w-full gap-0"),
    group: groupVariants,
    input: cva(
      "bg-control-surface text-control-active my-3 mr-1 ml-3 leading-normal"
    )
  }
};
