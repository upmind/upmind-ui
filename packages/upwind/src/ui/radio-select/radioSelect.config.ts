import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../input/input.config";

export const triggerVariants = cva(
  "static h-auto min-h-10 justify-start overflow-hidden rounded-md text-left",
  {
    variants: {
      width: {
        full: "w-full",
        auto: "w-auto",
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
      "flex cursor-pointer items-start space-x-2 border border-t-0 border-control"
    ),
    label: cva("m-0 h-full w-full rounded-md py-3 pr-6 text-xs "),
    input: cva("my-4 ml-3 mr-1 leading-normal"),
  },
};
