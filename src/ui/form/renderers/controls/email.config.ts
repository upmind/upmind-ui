import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  email: {
    items: cva("", {
      variants: {
        isLoading: { true: "animate-spin" },
        isSuccess: { true: "text-accent-success" }
      }
    })
  }
};
