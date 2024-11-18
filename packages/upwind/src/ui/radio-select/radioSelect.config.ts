import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../input/input.config";

export const triggerVariants = cva(
  "h-auto min-h-10 justify-start rounded-md py-2 text-left !text-primary",
  {
    variants: {
      width: {
        full: "w-full",
        auto: "w-auto",
        app: "w-app",
      },
    },
    defaultVariants: {
      width: "full",
    },
  }
);

export default {
  radioSelect: {
    root: cva(`${ringClasses} ${invalidRingClasses} w-full rounded-md`),
    trigger: triggerVariants,
    items: cva("gap-0"),
    item: cva(
      "hover:bg-control-active-muted flex items-start space-x-2 border border-t-0 border-control transition-all duration-300"
    ),
    label: cva(
      "m-0 h-full w-full cursor-pointer rounded-md py-3 pr-6 text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    ),
    input: cva("my-3 ml-3 mr-1 bg-control leading-normal text-control-active"),
  },
};
