import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  checkbox: {
    root: cva(
      "border-base-300 group-focus-within:border-primary group-focus-within:ring-primary group inline-flex size-[1.5em] items-center justify-center  rounded-md border outline-none ring-0 group-focus-within:ring-4 group-focus-within:ring-opacity-10",
      {
        variants: {
          size: {
            sm: "text-sm ",
            md: "",
            lg: "text-lg",
          },
          isDisabled: {
            true: "bg-base-100 ",
          },
          isChecked: {
            true: "group-focus-within:border-primary group-focus-within:ring-primary group-focus-within:ring-4 group-focus-within:ring-opacity-10",
          },
          isValid: {
            true: "border-success-300 group-focus-within:border-success group-focus-within:ring-success",
          },
          isInvalid: {
            true: "border-error-300 group-focus-within:!border-error group-focus-within:!ring-error group-focus-within:!ring-opacity-10",
          },
        },
        defaultVariants: {
          size: "md",
        },
      }
    ),

    icon: cva("size-3"),
  },
};
