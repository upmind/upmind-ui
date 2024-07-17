import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  avatar: {
    root: cva(
      "bg-base-200 relative m-0 flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full transition",
      {
        variants: {
          size: {
            xs: "size-6",
            sm: "size-8",
            md: "size-10",
            lg: "size-12",
            xl: "size-14",
            "2xl": "size-16",
          },
        },
        defaultVariants: {
          size: "md",
        },
      }
    ),
    loading: cva("absolute left-0 top-0 h-full w-full"),
    icon: cva("m-1 h-full w-full object-cover"),
    image: cva("h-full w-full object-cover"),
    caption: cva("m-0 text-current", {
      variants: {
        size: {
          xs: "text-xs",
          sm: "text-xs",
          md: "text-md",
          lg: "text-lg",
          xl: "text-xl",
          "2xl": "text-2xl",
        },
        forceCaption: {
          true: "absolute",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
  },
};
