import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses, persistentRing } from "../../assets/styles";

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
  },
  size: {
    md: "",
    lg: ""
  }
};

export const triggerVariants = cva(
  `bg-control-surface [&:hover,&:focus-within,&[data-hover=true],&[data-focus=true]]:shadow-control-hover control-radius shadow-control-default group flex cursor-pointer border-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${ringClasses} ${invalidRingClasses} h-auto min-w-0 items-center justify-start text-left font-medium`,
  {
    variants: {
      width: variants.width,
      size: {
        md: "text-md px-4 py-2",
        lg: "text-md-tight p-4"
      }
    },
    defaultVariants: {
      width: "full",
      size: "md"
    }
  }
);

export const itemVariants = cva(
  `data-[state=unchecked]:text-muted control-radius data-[state=checked]:bg-control-selected text-muted data-[state=checked]:text-control-selected focus:hover:text-control-selected cursor-pointer gap-3 px-4 py-2 font-normal outline outline-2 outline-offset-2 outline-transparent focus-visible:outline-[var(--color-control-ring)] ${invalidRingClasses}`
);

export const contentVariants = cva(
  `control-radius shadow-control-default bg-control-surface my-2 border-none ${persistentRing} flex max-h-72 min-w-(--radix-dropdown-menu-trigger-width) flex-col overflow-hidden p-2`,
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
    items: cva("flex min-h-0 w-full flex-col gap-0 overflow-y-auto"),
    group: groupVariants,
    input: cva(
      "bg-control-surface text-control-active my-3 mr-1 ml-3 leading-normal"
    )
  }
};
