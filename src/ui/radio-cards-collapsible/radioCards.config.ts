import { cva } from "class-variance-authority";
import { ringClasses } from "../../assets/styles";

export const itemVariants = cva(
  `bg-control-surface text-control-foreground group control-radius font-normal transition-all duration-200 ${ringClasses} shadow-control-default [&:hover,&[data-hover=true]]:shadow-control-hover [&:focus-within,&[data-focus=true]]:ring-ring flex cursor-pointer list-none gap-2 py-3 pr-4 pl-3 [&:focus-within,&[data-focus=true]]:ring-2 [&:focus-within,&[data-focus=true]]:ring-offset-2`,
  {
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
  }
);

export const rootVariants = cva(`grid w-full grid-cols-12 gap-2`);
export default {
  radioCards: {
    root: rootVariants,
    item: itemVariants,
    radio: cva("size-lh flex items-center justify-center"),
    input: cva(
      `shadow-control-default leading-normal [transition:border-color_200ms_ease-in-out]`
    )
  }
};
