import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  form: {
    root: cva("relative flex w-full flex-col gap-8"),
    loading: cva(""),
    content: cva("transition-opacity duration-300", {
      variants: {
        processing: {
          true: "pointer-events-none opacity-50 duration-0",
        },
        loading: {
          true: "pointer-events-none invisible opacity-0 duration-0",
        },
      },
    }),
    actions: cva("flex w-full flex-wrap gap-2 transition-all duration-300", {
      variants: {
        processing: {
          true: "pointer-events-none opacity-50",
        },
        loading: {
          true: "invisible opacity-0 duration-0",
        },
      },
    }),
  },
  formButton: {
    root: cva(
      "bg-base text-base-content border-base-200 hover:bg-base-50 relative flex w-full cursor-pointer items-center gap-x-2 text-nowrap rounded-lg border px-4 py-3 text-start text-sm font-medium shadow-sm before:absolute before:inset-0 before:z-[1] disabled:pointer-events-none disabled:opacity-50"
    ),
    active: cva("ring-primary-500 border-primary-500"),
    label: cva("flex-1 leading-none"),
    icon: cva("size-[1em] transition-all aria-checked:rotate-180"),
  },
};
