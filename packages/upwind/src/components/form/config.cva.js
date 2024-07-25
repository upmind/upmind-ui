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
      "bg-base text-base-content  hover:bg-base-50 relative flex w-full cursor-pointer items-center gap-x-2 text-nowrap rounded-lg border px-4 py-3 text-start text-sm font-medium shadow-sm before:absolute before:inset-0 before:z-[1]"
    ),
    active: cva("ring-control-active border-control-active"),
    label: cva("flex-1 leading-none"),
    icon: cva("size-[1em] transition-all aria-checked:rotate-180"),
  },
};
