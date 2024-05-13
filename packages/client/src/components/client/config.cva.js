import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  clientListings: {
    root: cva("w-full py-4 flex flex-col gap-4"),
    header: cva(""),
    footer: cva(""),
    items: cva("grid gap-4 grid-cols-3"),
    loading: cva(""),
    actions: cva(""),
  },
  clientForm: {
    root: cva("w-full mt-4", {
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
    root: cva("border p-2 rounded-lg flex  items-center gap-4", {
      variants: {
        isEditing: {
          true: "bg-base-200",
        },
        isHidden: {
          true: "hidden opacity-50 pointer-events-none",
        },
        hasErrors: {
          true: "border-error",
        },
      },
      compoundVariants: [
        {
          hasErrors: false,
          isSelected: true,
          class: "border-primary",
        },
      ],
    }),
    content: cva("flex-1"),
    header: cva("flex gap-4 items-center justify-start text-xs text-base-500"),
    icon: cva("size-4"),
    avatar: cva("size-6 rounded-full border overflow-hidden "),
    title: cva("m-0 leading-none text-sm text-base-content"),
    meta: cva("m-0"),
    verified: cva("", {
      variants: {
        isVerified: {
          true: "text-success",
          false: "text-warning",
        },
      },
    }),
    default: cva("size-4 text-primary"),
    errors: cva("text-error text-sm m-0"),
    actions: cva("flex gap-4 items-center justify-end"),
  },
  clientEmpty: {
    root: cva(
      "flex flex-col items-center justify-center gap-4 p-4 bg-base-100 rounded-lg"
    ),
    title: cva("text-inherit m-0"),
    text: cva("text-base-700 text-center m-0"),
    icon: cva("size-8 text-base-500"),
  },
};
