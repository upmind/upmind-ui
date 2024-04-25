import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  form: {
    root: cva("relative mx-auto flex w-full max-w-2xl flex-col gap-8"),
    spinner: cva(
      "absolute bottom-0 left-0 right-0 top-0 mx-auto size-6 opacity-80"
    ),
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
    actions: cva("flex gap-x-2 transition-all duration-300", {
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
