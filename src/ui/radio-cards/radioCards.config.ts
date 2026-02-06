import { cva } from "class-variance-authority";
import { ringClasses } from "../../assets/styles";

export const itemSizeVariants = cva("", {
  variants: {
    columns: {
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
    columns: 1
  }
});

export const itemVariants = cva(
  `bg-control-surface text-control-foreground group control-radius shadow-control-default [&:hover,&[data-hover=true]]:shadow-control-hover flex cursor-pointer list-none gap-2 rounded py-4 pr-4 pl-3 font-normal transition-shadow duration-200 md:my-0 ${ringClasses}`
);

export const rootVariants = cva(`grid w-full grid-cols-12 gap-2`);
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
