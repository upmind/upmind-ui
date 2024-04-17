import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  checkbox: {
    root: cva(
      "border-base-300 group-focus-within:border-primary group-focus-within:ring-primary group box-content inline-flex items-center justify-center rounded border outline-none ring-0 group-focus-within:ring-4 group-focus-within:ring-opacity-10",
      {
        variants: {
          size: {
            sm: "size-4 text-sm",
            md: "size-5",
            lg: "size-6 text-lg",
          },
          isDisabled: {
            true: "bg-base-100 ",
          },
          isChecked: {
            true: "bg-base-content border-base-content group-focus-within:border-primary group-focus-within:ring-primary text-base group-focus-within:ring-4 group-focus-within:ring-opacity-10",
          },
          // isValid: {
          //   true: "border-success-300 group-focus-within:border-success group-focus-within:ring-success",
          // },
          isInvalid: {
            true: "border-error-300 group-focus-within:!border-error group-focus-within:!ring-error group-focus-within:!ring-opacity-10",
          },
        },
        defaultVariants: {
          size: "md",
        },
      }
    ),

    icon: cva("", {
      variants: {
        size: {
          sm: "size-3",
          md: "size-4",
          lg: "size-5",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
  },
};
