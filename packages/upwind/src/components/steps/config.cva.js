import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
// animate-ping
export default {
  steps: {
    root: cva(
      " bg-base text-base-forground sticky top-0 z-10 -mx-4 -mt-8  border-b px-4 sm:-mx-6 sm:px-6 lg:-mx-20 lg:px-20"
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
            true: "text-base-forground font-normal",
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
          true: "bg-primary-forground text-primary",
        },
      },
      compoundVariants: [
        {
          complete: false,
          selected: true,
          class: "text-primary-forground bg-primary",
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
