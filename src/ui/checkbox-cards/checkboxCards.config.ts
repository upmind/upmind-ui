import { cva } from "class-variance-authority";
import {
  ringClasses,
  groupRingClasses,
  invalidRingClasses,
} from "../../assets/styles";

export const rootVariants = cva(`w-full`);

export const itemVariants = cva(
  `hover:bg-control-active-muted group flex items-start space-x-2 rounded-md border border-control bg-control text-control-foreground shadow-sm transition-all duration-300 ${ringClasses} ${invalidRingClasses}`
);

export default {
  checkboxCards: {
    root: rootVariants,
    item: itemVariants,
    label: cva(
      "m-0 h-full w-full cursor-pointer rounded-md py-3 pr-6 text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    ),
    input: cva(
      `${groupRingClasses} my-3 ml-3 mr-1 mt-[0.9rem] rounded-md border-control leading-normal text-control-active`
    ),
  },
};
