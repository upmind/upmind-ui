import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../../assets/styles";
// -----------------------------------------------------------------------------

export const variants = {
  variant: {
    outline:
      "bg-control-surface [&:hover,&:focus-within,&[data-hover=true],&[data-focus=true]]:shadow-control-hover shadow-control-default",
    ghost:
      "[&:hover,&:focus-within,&[data-hover=true],&[data-focus=true]]:bg-button-ghost-hover"
  },
  width: {
    auto: "w-auto min-w-40",
    full: "w-full"
  },
  size: {
    md: "text-sm",
    lg: "text-md"
  },
  hasRing: {
    true: `${ringClasses} ${invalidRingClasses}`,
    false:
      "ring-0 ring-transparent outline-none focus:ring-0 focus:ring-transparent focus:outline-none"
  }
};

export const rootVariants = cva(
  `control-radius group flex cursor-pointer border-none px-4 py-2 transition-all duration-200`,
  {
    variants,
    defaultVariants: {
      variant: "outline",
      width: "full"
    }
  }
);

// -----------------------------------------------------------------------------
export default {
  select: {
    root: rootVariants,
    value: cva("text-control-foreground", {
      variants: {
        hasValue: {
          true: "",
          false:
            "text-faint transition-colors duration-200 [.group:focus-within_&,.group[data-focus=true]_&]:text-base [.group:hover_&,.group[data-hover=true]_&]:text-base"
        },
        size: variants.size
      }
    }),
    item: cva(
      "data-[state=unchecked]:text-muted control-radius data-[state=unchecked]:hover:text-control-selected data-[highlighted]:!text-control-selected data-[state=checked]:bg-control-selected data-[state=checked]:text-control-selected cursor-pointer gap-3 rounded px-4 py-2 font-normal transition-all duration-200",
      {
        variants: {
          size: variants.size
        }
      }
    ),
    content: cva(
      `control-radius shadow-control-default bg-control-surface ring-primitive-control-default! my-1 border-none ${ringClasses} ${invalidRingClasses} p-0`
    )
  }
};
