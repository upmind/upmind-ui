import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../input/input.config";

export const rootVariants = cva(`grid w-full grid-cols-12 gap-2`);

export const itemVariants = cva(
  `${ringClasses} ${invalidRingClasses} hover:bg-control-active-hover col-span-12 flex items-start space-x-1 border border-control bg-control text-control-foreground shadow-sm transition-all duration-200`,
  {
    variants: {
      layout: {
        list: "border-b border-control first:rounded-t-md last:rounded-b-md",
        grid: "h-full w-full rounded-md",
      },
      width: {
        1: "md:col-span-1",
        2: "md:col-span-2",
        3: "md:col-span-3",
        4: "md:col-span-4",
        5: "md:col-span-5",
        6: "md:col-span-6",
        7: "md:col-span-7",
        8: "md:col-span-8",
        9: "md:col-span-9",
        10: "md:col-span-10",
        11: "md:col-span-11",
        12: "md:col-span-12",
      },
    },
    compoundVariants: [
      {
        layout: "grid",
        className:
          "data-[state=checked]:bg-control-active-focus data-[state=checked]:ring-2 data-[state=checked]:ring-control-active",
      },
    ],
    defaultVariants: {
      layout: "list",
      width: 12,
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
