import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const rootVariants = cva("flex flex-col gap-4", {
  variants: {
    size: {
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
      "3xl": "max-w-3xl",
      "4xl": "max-w-4xl",
      app: "max-w-app",
      full: "max-w-none"
    }
  },
  defaultVariants: {
    size: "full"
  }
});

export default {
  hero: {
    root: rootVariants,
    title: cva(
      "font-display flex items-center gap-x-5 text-4xl text-balance md:text-5xl"
    ),
    subtitle: cva("text-lg"),
    description: cva("text-muted text-md")
  }
};
