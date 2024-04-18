import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export default {
  checkbox: {
    input: cva("", {
      variants: {
        isValid: {
          true: "focus:border-success focus:ring-success",
        },
        isInvalid: {
          true: "border-error-300 focus:!border-error focus:!ring-error focus:!ring-opacity-20",
        },
      },
    }),
  },
};
