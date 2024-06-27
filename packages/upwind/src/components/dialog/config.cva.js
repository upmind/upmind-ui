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
          light: "bg-white/75",
          primary: "bg-primary/25",
          secondary: "bg-secondary/25",
          accent: "bg-accent/25",
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

    panelWrapper: cva(
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

    panel: cva("flex w-full flex-col items-start justify-start"),

    panelHeader: cva(
      "border-base-300 flex w-full items-center justify-between gap-2 border-b p-6"
    ),

    panelContent: cva(
      "flex max-h-[70vh] w-full flex-col items-start justify-start gap-4 overflow-y-auto px-6 py-6",
      {
        variants: {
          hasActions: {
            true: "min-h-[30rem]", // 480px
          },
        },
      }
    ),

    panelActions: cva(
      "border-base-300 flex w-full items-center justify-between gap-2 border-t p-6"
    ),

    title: cva("m-0 text-lg font-medium leading-6 text-inherit"),

    text: cva("m-0 text-sm"),

    data: cva("m-0 text-xs"),

    close: cva("!size-6 [&>*>.icon]:!size-4 "),
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
