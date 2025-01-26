import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../input/input.config";

export const rootVariants = cva(
  `${ringClasses} ${invalidRingClasses} w-full gap-0 space-y-2 overflow-hidden rounded-md`
);

export const itemVariants = cva(
  "hover:bg-control-active-muted flex items-start space-x-2 rounded-md border border-control bg-control text-control-foreground shadow-sm transition-all duration-300"
);

export default {
  checkboxCards: {
    root: rootVariants,
    item: itemVariants,
    label: cva(
      "m-0 h-full w-full cursor-pointer rounded-md py-3 pr-6 text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    ),
    input: cva(
      "my-3 ml-3 mr-1 mt-[0.9rem] border-control leading-normal text-control-active"
    ),
  },
};
