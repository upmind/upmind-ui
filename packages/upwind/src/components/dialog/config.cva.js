import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
export default {
  dialog: {
    root: cva("relative z-10"),
    skrim: cva("fixed inset-0", {
      variants: {
        skrim: {
          none: "bg-transparent",
          normal: "bg-black/25",
          dark: "bg-black/50",
          light: "bg-white/25",
          primary: "bg-primary/25",
          secondary: "bg-secondary/25",
          accent: "bg-accent/25",
          neutral: "bg-neutral/25",
          success: "bg-success/25",
          error: "bg-error/25",
          warning: "bg-warning/25",
          info: "bg-info/25",
        },
      },
      defaultVariants: {
        skrim: "default",
      },
    }),

    wrapper: cva("fixed inset-0 overflow-y-auto"),

    content: cva(
      "flex min-h-full w-full flex-col items-center justify-center p-4 text-center"
    ),

    panel: cva(
      "bg-base text-base-content relative transform  rounded-lg  text-left align-middle shadow-xl transition-all",
      {
        variants: {
          size: {
            auto: "max-w-none",
            full: "w-full max-w-full",
            sm: "w-full max-w-sm",
            md: "w-full max-w-md",
            lg: "w-full max-w-lg",
            xl: "w-full max-w-xl",
            "2xl": "w-full max-w-4xl",
          },
        },
        defaultVariants: {
          size: "2xl",
        },
      }
    ),

    panelContent: cva(
      "flex w-full flex-col items-start justify-start gap-4 p-6"
    ),

    title: cva("m-0 font-medium leading-6 text-inherit"),
    // text-lg font-medium leading-6 text-gray-900
    text: cva("m-0 text-sm"),

    data: cva("m-0 text-xs"),

    actions: cva(""),

    close: cva(
      "!absolute right-0 top-0 !size-4 !rounded-full !p-3 [&>*>.icon]:!size-4 "
    ),
  },

  dialogTransitionEnter: {
    active: cva("duration-300 ease-out"),
    from: cva("scale-95 opacity-0"),
    to: cva("scale-100 opacity-100"),
  },
  dialogTransitionLeave: {
    active: cva("duration-200 ease-in"),
    from: cva("scale-100 opacity-100"),
    to: cva("scale-95 opacity-0"),
  },

  skrimTransitionEnter: {
    active: cva("duration-300 ease-out"),
    from: cva("opacity-0"),
    to: cva("opacity-100"),
  },
  skrimTransitionLeave: {
    active: cva("duration-200 ease-in"),
    from: cva("opacity-100"),
    to: cva("opacity-0"),
  },
};
