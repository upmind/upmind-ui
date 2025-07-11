import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export const titleVariants = cva("m-0", {
  variants: {
    size: {
      inherit: "text-inherit",
      sm: "text-sm",
      md: "text-md",
      lg: "text-lg",
      xl: "text-xl md:text-2xl",
      "2xl": "text-2xl md:text-3xl",
      "3xl": "text-3xl md:text-4xl"
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
    "bg-background text-foreground flex w-full flex-grow flex-wrap transition-colors"
  ),
  section: {
    root: cva("w-full"),
    header: cva(
      "mb-4 ml-[1px] flex flex-wrap items-end justify-between gap-4 md:mb-4 md:mt-4"
    ),
    title: cva("text-foreground m-0 !text-3xl"),
    tagline: cva("text-base-700 text-sm"),
    content: cva("w-full"),
    footer: cva(
      "text-base-700 mt-6 flex flex-col space-y-2 text-xs md:space-y-0"
    )
  },
  title: titleVariants,
  description: cva("text-emphasis-medium my-0 text-sm italic leading-5")
};
