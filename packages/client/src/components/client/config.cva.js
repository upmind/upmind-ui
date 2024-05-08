import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  clientListings: {
    root: cva("grid gap-4 grid-cols-card w-full"),
    loading: cva(),
    actions: cva(""),
  },
  clientForm: {
    root: cva("border rounded-lg shadow-lg p-4 flex flex-col gap-4", {
      variants: {
        hasErrors: {
          true: "border-error",
        },
        isComplete: {
          true: "border-primary",
        },
      },
    }),
    title: cva("text-inherit m-0"),
    form: cva("max-w-xl"),
  },
  clientCard: {
    root: cva(""),
  },
};
