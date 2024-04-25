import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  radio: {
    root: cva("relative inline-flex shrink-0 items-center justify-center", {
      variants: {
        size: {
          sm: "size-5",
          md: "size-6",
          lg: "size-7",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
    input: cva(
      "border-base-300 appearance-none rounded-[100%] border outline-none ring-0",
      {
        variants: {
          size: {
            sm: "size-4",
            md: "size-5",
            lg: "size-6",
          },
          isDisabled: {
            true: "bg-base-100",
          },
          isChecked: {
            true: `bg-base-content border-base-content text-base`,
          },
        },
        compoundVariants: [
          {
            isInvalid: true,
            isDisabled: false,
            class: "border-error-300",
          },
          {
            isValid: true,
            isDisabled: false,
            class: "",
          },
          {
            isFocused: true,
            isInvalid: false,
            isValid: false,
            isDisabled: false,
            class: "border-primary ring-primary ring-4 ring-opacity-20",
          },

          {
            isFocused: true,
            isInvalid: true,
            isDisabled: false,
            class: "border-error ring-error ring-4 ring-opacity-20",
          },
          {
            isFocused: true,
            isValid: true,
            isDisabled: false,
            class: "border-success ring-success ring-4 ring-opacity-20",
          },
        ],
        defaultVariants: {
          size: "md",
        },
      }
    ),
    icon: cva(
      "pointer-events-none absolute bottom-0 left-0 right-0 top-0 m-auto",
      {
        variants: {
          size: {
            sm: "size-2",
            md: "size-3",
            lg: "size-4",
          },
          isDisabled: {
            true: "text-base-content",
          },
          isChecked: {
            true: `text-base`,
          },
        },
        defaultVariants: {
          size: "md",
        },
      }
    ),
  },
};
