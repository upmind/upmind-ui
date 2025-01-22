import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../input/input.config";

export const rootVariants = cva(`grid w-full grid-cols-12 gap-2`);

export const itemVariants = cva(
  `${ringClasses} ${invalidRingClasses} hover:bg-control-active-hover flex items-start space-x-1 border border-control bg-control text-control-foreground shadow-sm transition-all duration-200`,
  {
    variants: {
      layout: {
        list: "border-b border-control first:rounded-t-md last:rounded-b-md",
        grid: "h-full w-full rounded-md",
      },
      width: {
        0: "",
        1: "col-span-12 md:col-span-1",
        2: "col-span-12 md:col-span-2",
        3: "col-span-12 md:col-span-3",
        4: "col-span-12 md:col-span-4",
        5: "col-span-12 md:col-span-5",
        6: "col-span-12 md:col-span-6",
        7: "col-span-12 md:col-span-7",
        8: "col-span-12 md:col-span-8",
        9: "col-span-12 md:col-span-9",
        10: "col-span-12 md:col-span-10",
        11: "col-span-12 md:col-span-11",
        12: "col-span-12 md:col-span-12",
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
      "m-0 h-full w-full cursor-pointer rounded-md py-3.5 pr-4 text-md font-medium leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    ),
    input: cva("my-3 ml-4 mr-1 mt-4 leading-normal text-control-active"),
  },
};
