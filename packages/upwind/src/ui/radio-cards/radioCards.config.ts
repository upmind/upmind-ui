import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../input/input.config";

export const rootVariants = cva(`w-full gap-2`, {
  variants: {
    layout: {
      list: `${ringClasses} ${invalidRingClasses}`,
      grid: "grid list-none",
    },
  },
  defaultVariants: {
    layout: "list",
  },
});

export const itemVariants = cva(
  "hover:bg-control-active-hover flex items-start space-x-1 border border-control bg-control text-control-foreground shadow-sm transition-all duration-200",
  {
    variants: {
      layout: {
        list: "border-b border-control first:rounded-t-md last:rounded-b-md",
        grid: "h-full w-full rounded-md",
      },
      ring: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        layout: "grid",
        ring: true,
        className:
          "data-[state=checked]:bg-control-active-focus data-[state=checked]:ring-2 data-[state=checked]:ring-control-active",
      },
    ],
    defaultVariants: {
      layout: "list",
      ring: true,
    },
  }
);

export default {
  radioCards: {
    root: rootVariants,
    item: itemVariants,
    label: cva(
      "m-0 h-full w-full cursor-pointer rounded-md py-3.5 pr-4 text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    ),
    input: cva("my-3 ml-4 mr-1 mt-4 leading-normal text-control-active"),
  },
};
