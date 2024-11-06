import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../input/input.config";

export const rootVariants = cva(`w-full gap-0 rounded-md border-control`, {
  variants: {
    layout: {
      list: `${ringClasses} ${invalidRingClasses} border border-b-0 shadow-sm`,
      grid: "",
    },
  },
  defaultVariants: {
    layout: "list",
  },
});

export const itemVariants = cva(
  "hover:bg-control-active-muted flex items-start space-x-2 bg-control text-control-foreground transition-all duration-300",
  {
    variants: {
      layout: {
        list: "border-b border-control first:rounded-t-md last:rounded-b-md",
        grid: `data-[state=checked]:bg-control-active-background rounded-md border-control shadow-sm data-[state=unchecked]:border data-[state=checked]:ring-2 data-[state=checked]:ring-control-active `,
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
    label: cva(
      "m-0 h-full w-full cursor-pointer rounded-md py-3 pr-6 text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    ),
    input: cva("my-3 ml-3 mr-1 leading-normal text-control-active"),
  },
};
