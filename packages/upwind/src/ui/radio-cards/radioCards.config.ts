import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../input/input.config";

export const rootVariants = cva(
  `${ringClasses} ${invalidRingClasses} w-full gap-0 overflow-hidden rounded-lg border-control`,
  {
    variants: {
      layout: {
        list: "border border-b-0 shadow-sm",
        grid: "",
      },
    },
    defaultVariants: {
      layout: "list",
    },
  }
);

export const itemVariants = cva(
  "flex items-start space-x-2 transition-all duration-300 hover:bg-base-100",
  {
    variants: {
      layout: {
        list: "border-b border-control",
        grid: "rounded-md border border-control shadow-sm",
      },
    },
    defaultVariants: {
      layout: "list",
    },
  }
);

export default {
  radioCards: {
    root: rootVariants,
    item: itemVariants,
    label: cva("m-0 h-full w-full cursor-pointer rounded-md py-3 pr-6 text-xs"),
    input: cva("text-current-active my-3 ml-3 mr-1 leading-normal"),
  },
};
