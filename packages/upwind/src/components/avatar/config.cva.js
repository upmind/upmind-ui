import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  avatar: {
    root: cva(
      "bg-base-200 m-0 flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full",
      {
        variants: {
          size: {
            sm: "size-6",
            md: "size-8",
            lg: "size-12",
          },
        },
        defaultVariants: {
          size: "md",
        },
      }
    ),
    icon: cva("h-full w-full object-cover"),
    image: cva("h-full w-full object-cover"),
    caption: cva("m-0", {
      variants: {
        size: {
          sm: "text-xs",
          md: "text-md",
          lg: "text-lg",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
  },
};
