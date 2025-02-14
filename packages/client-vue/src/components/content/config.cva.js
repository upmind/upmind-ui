import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

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
    header: cva("mb-4 ml-[1px] mt-6 flex items-end justify-between md:mb-6"),
    title: cva(
      "text-base-foreground m-0 !text-3xl leading-tight [&:has(mask)]:leading-normal"
    ),
    tagline: cva("text-base-700 text-sm leading-tight"),
    content: cva("w-full"),
    footer: cva(
      "text-base-700 mt-6 flex flex-col space-y-2 text-xs md:space-y-0"
    ),
  },
  content: cva(
    "prose max-w-app z-10 mx-auto w-full flex-wrap items-start justify-start pb-16 pt-10 md:pb-32 md:pt-16"
  ),
  title: cva("m-0 text-2xl md:text-3xl", {
    variants: {
      align: {
        inherit: "text-inherit",
        left: "text-left",
        center: "text-center",
        right: "text-right",
      },
      defaultVariants: {
        align: "inherit",
      },
    },
  }),
  keyword: cva(""),
};
