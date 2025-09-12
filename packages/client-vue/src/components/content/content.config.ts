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
  page: cva(
    "bg-background text-foreground flex w-full max-w-none grow flex-wrap transition-colors"
  ),
  title: titleVariants,
  description: cva("text-emphasis-medium my-0 text-sm"),
  header: {
    root: cva("flex flex-col gap-1"),
    title: cva("font-display text-4xl text-balance md:text-5xl"),
    description: cva("text-emphasis-medium text-lg")
  },
  section: {
    header: cva("flex justify-between", {
      variants: {
        variant: {
          full: "border-b pb-3",
          default: "border-b pb-3",
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
    content: cva("flex w-full flex-col gap-3"),
    title: cva("text-emphasis-medium w-full text-xl")
  }
};
