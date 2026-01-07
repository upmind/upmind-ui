import { cva } from "class-variance-authority";
import { ringClasses } from "../../assets/styles";

export const itemSizeVariants = cva("", {
  variants: {
    width: {
      0: "",
      1: "col-span-12 md:col-span-12",
      2: "col-span-12 md:col-span-6",
      3: "col-span-12 md:col-span-4",
      4: "col-span-12 md:col-span-3",
      5: "col-span-12 md:col-span-2",
      6: "col-span-12 md:col-span-2"
    }
  },
  defaultVariants: {
    width: 1
  }
});

export const itemVariants = cva(
  `bg-control-surface text-control-foreground group control-radius flex cursor-pointer list-none gap-2 py-4 pr-4 pl-3 font-normal transition-all duration-200 md:my-0 ${ringClasses}`,
  {
    variants: {
      isList: {
        true: "my-0.5 border-0",
        false:
          "shadow-control-default [&:hover,&[data-hover=true]]:shadow-control-hover [&:focus-within,&[data-focus=true]]:ring-ring rounded [&:focus-within,&[data-focus=true]]:ring-2 [&:focus-within,&[data-focus=true]]:ring-offset-2"
      }
    },
    defaultVariants: {
      isList: false
    }
  }
);

export const rootVariants = cva(`w-full`, {
  variants: {
    isList: {
      true: "flex flex-col gap-2",
      false: "grid grid-cols-12 gap-2"
    }
  },
  defaultVariants: {
    isList: false
  }
});
export default {
  radioCards: {
    root: rootVariants,
    item: {
      root: itemVariants,
      size: itemSizeVariants
    },
    radio: cva("size-lh text-md-tight flex items-center justify-center"),
    content: {
      label: cva("text-md-tight text-display font-medium"),
      secondaryLabel: cva("text-md-tight text-display font-medium"),
      description: cva("text-sm-tight text-base font-normal"),
      secondaryDescription: cva("text-muted text-sm-tight font-normal")
    }
  }
};
