import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
// animate-ping
export default {
  steps: {
    root: cva(
      "border-base-300 bg-base text-base-content sticky top-0 z-10 -mx-4 -mt-8 flex flex-row items-center justify-start gap-8 border-b px-4 sm:-mx-6 sm:px-6 lg:-mx-20 lg:px-20"
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
            true: "text-base-content font-normal",
          },
          disabled: {
            true: "pointer-events-none cursor-not-allowed opacity-50",
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
          true: "bg-primary-content text-primary",
        },
      },
      compoundVariants: [
        {
          complete: false,
          selected: true,
          class: "bg-primary text-primary-content",
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
