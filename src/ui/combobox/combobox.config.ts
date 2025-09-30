import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../../assets/ring.styles";

export const variants = {
  size: {
    md: "",
    lg: ""
  }
};

export const triggerVariants = cva(
  "text-md bg-background-control-surface [&:hover,&:focus-within,&[data-hover=true],&[data-focus=true]]:shadow-border-border-control-hover control-radius shadow-border-border-control-default h-auto justify-between gap-2 px-4 py-2 transition-all duration-300",
  {
    variants: {
      size: variants.size,
      width: {
        "2xs": "w-dropdown-2xs",
        xs: "w-dropdown-xs",
        sm: "w-dropdown-sm",
        md: "w-dropdown-md",
        lg: "w-dropdown-lg",
        xl: "w-dropdown-xl",
        "2xl": "w-dropdown-2xl",
        full: "w-full",
        auto: "w-auto",
        fit: "w-auto",
        app: "w-app"
      }
    },
    defaultVariants: {
      width: "full"
    }
  }
);

export const itemVariants = cva(
  "data-[state=unchecked]:text-text-muted data-[state=unchecked]:hover:text-text-base data-[state=unchecked]:focus:text-text-base data-[state=checked]:text-text-base data-[state=checked]:bg-background-control-selected [&:hover,&[data-hover=true]]:bg-background-control-selected [&:focus,&[data-focus=true]]:bg-background-control-selected cursor-pointer gap-3 rounded px-4 py-2 font-normal transition-all duration-200"
);

export const contentVariants = cva(
  `control-radius shadow-border-border-control-default bg-background-control-surface mt-2 border-none ${ringClasses} ${invalidRingClasses} p-0`,
  {
    variants: {
      width: {
        "2xs": "w-dropdown-2xs",
        xs: "w-dropdown-xs",
        sm: "w-dropdown-sm",
        md: "w-dropdown-md",
        lg: "w-dropdown-lg",
        xl: "w-dropdown-xl",
        "2xl": "w-dropdown-2xl",
        full: "w-full",
        auto: "w-(--radix-popover-trigger-width)",
        fit: "w-fit",
        app: "w-app"
      }
    }
  }
);

export const labelVariants = cva("px-0.5", {
  variants: {
    truncate: {
      true: "truncate",
      false: ""
    }
  }
});

export const rootVariants = cva("w-full rounded", {
  variants: {
    hasRing: {
      true: `${ringClasses} ${invalidRingClasses}`,
      false: ""
    }
  }
});

export default {
  combobox: {
    root: rootVariants,
    trigger: triggerVariants,
    content: contentVariants,
    label: labelVariants,
    item: itemVariants,
    input: cva(
      "text-text-base! placeholder:text-text-muted! rounded-none shadow-none ring-0!"
    )
  }
};
