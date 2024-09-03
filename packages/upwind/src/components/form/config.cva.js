import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  form: {
    root: cva("relative flex w-full flex-col gap-8"),
    loading: cva(""),
    content: cva("transition-opacity duration-300", {
      variants: {
        disabled: {
          true: "cursor-not-allowed",
        },
        processing: {
          true: "cursor-wait duration-0",
        },
        loading: {
          true: "invisible opacity-0 duration-0",
        },
      },
    }),
    actions: cva("flex w-full flex-wrap gap-2 transition-all duration-300", {
      variants: {
        disabled: {
          true: "cursor-not-allowed",
        },
        processing: {
          true: "cursor-wait",
        },
        loading: {
          true: "invisible opacity-0 duration-0",
        },
      },
    }),
  },
  formButton: {
    root: cva(
      "relative flex  w-full cursor-pointer items-center gap-x-2 text-nowrap rounded-lg border bg-base px-4 py-3 text-start text-sm font-medium text-base-foreground shadow-sm before:absolute before:inset-0 before:z-[1] hover:bg-base-50"
    ),
    active: cva("border-control-active ring-control-active"),
    label: cva("flex-1 leading-none"),
    icon: cva("size-[1em] transition-all aria-checked:rotate-180"),
  },
};
