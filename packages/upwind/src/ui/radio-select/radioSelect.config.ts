import { cva } from "class-variance-authority";

export const triggerVariants = cva(
  "static h-auto min-h-10 justify-start overflow-hidden text-left",
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
    trigger: triggerVariants,
    items: cva("gap-0"),
    item: cva(
      "flex cursor-pointer items-start space-x-2 border border-t-0 border-control"
    ),
    label: cva("m-0 h-full w-full rounded-md py-3 pr-6 text-xs "),
    input: cva("my-4 ml-3 mr-1 leading-normal"),
  },
};
