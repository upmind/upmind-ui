import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export default {
  checkbox: {
    root: cva("relative block", {
      variants: {
        size: {
          sm: "size-4 text-sm",
          md: "size-5",
          lg: "size-6 text-lg",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
    input: cva(
      "border-base-300 group-focus-within:border-primary group-focus-within:ring-primary group size-full shrink-0 appearance-none rounded border outline-none ring-0 group-focus-within:ring-4 group-focus-within:ring-opacity-20",
      {
        variants: {
          isDisabled: {
            true: "bg-base-100 ",
          },
          isChecked: {
            true: `bg-base-content border-base-content group-focus-within:border-primary group-focus-within:ring-primary text-base group-focus-within:ring-4 group-focus-within:ring-opacity-20`,
          },
          isValid: {
            true: "group-focus-within:border-success group-focus-within:ring-success",
          },
          isInvalid: {
            true: "border-error-300 group-focus-within:!border-error group-focus-within:!ring-error group-focus-within:!ring-opacity-20",
          },
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
