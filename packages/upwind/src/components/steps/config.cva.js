import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
// animate-ping
export default {
  steps: {
    root: cva(
      " sticky top-0 z-10 -mx-4 -mt-8 border-b bg-base  px-4 text-base-foreground sm:-mx-6 sm:px-6 lg:-mx-20 lg:px-20"
    ),
    wrapper: cva(
      "mx-auto flex flex max-w-screen-2xl flex-row items-center justify-start gap-8"
    ),
  },

  step: {
    root: cva(
      "m-0 flex items-center gap-3 border-b-2 py-6 font-light leading-none no-underline transition",
      {
        variants: {
          selected: {
            true: "border-primary font-normal",
            false: "border-transparent",
          },
          complete: {
            true: "font-normal text-base-foreground",
          },
          disabled: {
            true: "cursor-not-allowed opacity-50",
          },
          processing: {
            true: "cursor-wait",
          },
        },
        defaultVariants: {
          selected: false,
          complete: false,
          disabled: false,
        },
      }
    ),
    loading: cva("bg-base-200 text-current"),
    avatar: cva("", {
      variants: {
        complete: {
          true: "bg-primary-foreground text-primary",
        },
      },
      compoundVariants: [
        {
          complete: false,
          selected: true,
          class: "bg-primary text-primary-foreground",
        },
      ],
      defaultVariants: {
        complete: false,
        selected: false,
      },
    }),
    label: cva(""),
  },
};
