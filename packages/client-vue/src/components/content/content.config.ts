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
      "3xl": "text-3xl md:text-4xl",
    },
    align: {
      inherit: "text-inherit",
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
    defaultVariants: {
      align: "inherit",
      size: "inherit",
    },
  },
});

export default {
  card: cva(
    "bg-base-background text-base-foreground rounded-lg p-5 px-6 shadow-sm md:p-8 md:px-9",
    {
      variants: {
        isDisabled: {
          true: "pointer-events-none opacity-50",
        },
      },
      defaultVariants: {
        isDisabled: false,
      },
    }
  ),
  section: {
    root: cva("w-full"),
    header: cva(
      "mb-4 ml-[1px] flex flex-wrap items-end justify-between gap-4 md:mb-6 md:mt-6"
    ),
    title: cva("text-base-foreground m-0 !text-3xl"),
    tagline: cva("text-base-700 text-sm"),
    content: cva("w-full"),
    footer: cva(
      "text-base-700 mt-6 flex flex-col space-y-2 text-xs md:space-y-0"
    ),
  },
  content: cva(
    "prose max-w-app z-10 mx-auto w-full flex-wrap items-start justify-start pb-16 pt-10 md:pb-32 md:pt-16"
  ),
  title: titleVariants,
  description: cva("text-emphasis-medium my-0 text-sm italic leading-5"),
};
