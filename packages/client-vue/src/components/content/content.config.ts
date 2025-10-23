import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export const titleVariants = cva("font-display m-0 [&_strong]:font-medium", {
  variants: {
    size: {
      inherit: "text-inherit",
      sm: "text-sm",
      md: "text-md",
      lg: "text-lg",
      xl: "text-xl md:text-2xl",
      "2xl": "text-2xl md:text-3xl",
      "3xl": "text-3xl md:text-4xl",
      "4xl": "text-4xl md:text-5xl"
    },
    align: {
      inherit: "text-inherit",
      left: "text-left",
      center: "text-center",
      right: "text-right"
    },
    defaultVariants: {
      align: "inherit",
      size: "inherit"
    }
  }
});

export default {
  title: titleVariants,
  description: cva("text-muted my-0 text-sm"),
  header: {
    root: cva("flex flex-col gap-1"),
    title: cva("font-display text-4xl text-balance md:text-5xl"),
    description: cva("text-muted text-md/tight md:text-lg")
  },
  section: {
    header: cva("flex justify-between", {
      variants: {
        variant: {
          full: "border-surface border-b pb-4",
          default: "border-surface border-b pb-4",
          twoColumnLTR: "border-surface border-b pb-4",
          twoColumnRTL: "border-surface border-b pb-4",
          enclosed: ""
        }
      }
    }),
    root: cva("flex w-full flex-col", {
      variants: {
        variant: {
          default: "gap-9",
          full: "gap-9",
          enclosed: "gap-3"
        }
      }
    }),
    content: cva("flex w-full flex-col gap-8"),
    title: {
      root: cva("flex items-center gap-2"),
      heading: cva("text-md/tight text-base font-medium")
    }
  }
};
