import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../../assets/styles";

export const variants = {
  size: {
    md: "text-sm font-normal",
    lg: "text-md font-normal"
  },
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
};

export const triggerVariants = cva(
  "text-md bg-control-surface [&:hover,&[data-hover=true]]:shadow-control-hover control-radius shadow-control-default h-auto justify-between gap-2 text-base transition-all duration-200",
  {
    variants
  }
);

export const itemVariants = cva(
  "data-[selected=false]:text-muted data-[selected=true]:text-control-selected data-[selected=true]:bg-control-selected [&:focus,&[data-focus=true]]:bg-control-selected control-radius data-[selected=false]:hover:text-control-selected data-[selected=false]:active:text-control-selected data-[selected=false]:active:bg-control-selected data-[highlighted]:!text-control-selected cursor-pointer gap-3 px-4 py-2 font-normal transition-all duration-200 data-[selected=true]:text-base",
  {
    variants: {
      size: {
        md: "text-sm font-normal",
        lg: "text-md font-normal"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);

export const contentVariants = cva(
  `control-radius shadow-control-default bg-control-surface ring-primitive-control-default! my-2 overflow-hidden border-none ${ringClasses} ${invalidRingClasses} p-0 pr-1 pb-1`,
  {
    variants: {
      dropdownWidth: variants.width
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

export const inputVariants = cva(
  "placeholder:text-muted! rounded-none text-base shadow-none ring-0!",
  {
    variants: {
      size: {
        md: "text-sm font-normal",
        lg: "text-md font-normal"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);

export default {
  combobox: {
    root: rootVariants,
    trigger: triggerVariants,
    content: contentVariants,
    label: labelVariants,
    item: itemVariants,
    input: inputVariants
  }
};
