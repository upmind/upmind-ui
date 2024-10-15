import { cva } from "class-variance-authority";

export const triggerVariants = cva(
  "static h-auto min-h-10 overflow-hidden px-3 py-2",
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

export const contentVariants = cva("", {
  variants: {
    color: {
      base: "text-base",
      primary: "text-primary",
      secondary: "text-secondary",
      accent: "text-accent",
      success: "text-success",
      error: "text-error",
      warning: "text-warning",
      info: "text-info",
      promotion: "text-promotion",
    },
  },
  defaultVariants: {
    color: "base",
  },
});

export default {
  radioSelect: {
    trigger: triggerVariants,
    items: cva("gap-0"),
    item: cva(
      "flex cursor-pointer items-center space-x-2 border border-t-0 border-control"
    ),
    label: cva("m-0 w-full rounded-md py-3 pr-6 "),
    input: cva("ml-3 mr-1"),
    content: contentVariants,
  },
};
