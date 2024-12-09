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
  "hover:bg-control-active-hover flex items-start space-x-2 bg-control text-control-foreground transition-all duration-200",
  {
    variants: {
      layout: {
        list: "border-b border-control first:rounded-t-md last:rounded-b-md",
        grid: "data-[state=checked]:bg-control-active-background hover:data-[state=checked]:bg-control-active-hover rounded-md border border-control shadow-sm",
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
          "data-[state=checked]:ring-2 data-[state=checked]:ring-control-active",
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
      "m-0 h-full w-full cursor-pointer rounded-md py-3 pr-4 text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    ),
    input: cva("my-3 ml-3 mr-1 mt-[0.9rem] leading-normal text-control-active"),
  },
};
