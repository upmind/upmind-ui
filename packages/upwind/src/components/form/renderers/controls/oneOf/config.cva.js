import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  select: {
    root: cva("flex-1 bg-transparent leading-normal outline-none", {
      variants: {
        size: {
          sm: "px-3 py-2 text-sm ",
          md: "px-3 py-3",
          lg: "px-3 py-4 text-lg",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
    option: cva(""),
  },
  // ---------------------------------------------------------------------------
  inputControl: {
    inline: cva(
      "border-base-300 focus-within:border-primary focus-within:ring-primary group inline-flex w-full items-center gap-x-3 rounded-lg border px-2 py-0 ring-0 focus-within:ring-4 focus-within:ring-opacity-20",
      {
        variants: {
          size: {
            sm: "px-3 py-2 text-sm ",
            md: "px-3 py-3",
            lg: "px-3 py-4 text-lg",
          },

          isDisabled: {
            true: "bg-base-100 pointer-events-none opacity-50",
          },
          isValid: {
            true: "focus-within:border-success focus-within:ring-success",
          },
          isInvalid: {
            true: "border-error-300 focus-within:!border-error focus-within:!ring-error focus-within:!ring-opacity-20",
          },
        },
        defaultVariants: {
          size: "md",
        },
      }
    ),
  },
  feedback: {
    root: cva(
      "text-base-500 flex items-center gap-x-2 text-xs transition-opacity duration-300",
      {
        variants: {
          hasFeedback: {
            false: "invisible hidden w-0 overflow-hidden text-nowrap opacity-0",
          },
          isInvalid: {
            true: "text-error",
          },
        },
      }
    ),
    icon: cva("size-4"),
  },
  label: {
    root: cva("cursor-pointer"),
  },
  // ---------------------------------------------------------------------------
  radio: {
    input: cva("", {
      variants: {
        isValid: {
          true: "focus:border-success focus:ring-success ",
        },
        isInvalid: {
          true: "border-error-300 focus:!border-error focus:!ring-error  focus:!ring-opacity-20",
        },
      },
    }),
  },
  list: {
    root: cva("relative flex flex-col gap-1"),
    title: cva("m-0 p-0"),
    wrapper: cva("m-0 flex w-full list-none flex-col gap-2 p-0"),
    option: cva("m-0 p-0"),
  },
};
