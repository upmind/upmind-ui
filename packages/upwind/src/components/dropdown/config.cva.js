import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

export default {
  dropdown: {
    root: cva("relative inline-flex"),
    items: cva(
      "bg-base border-base-200 [&::-webkit-scrollbar-thumb]:bg-base-300 [&::-webkit-scrollbar-track]:bg-base-100 z-50 !m-0 max-h-72 w-full min-w-60 space-y-0.5 overflow-hidden overflow-y-auto rounded-lg border p-1 shadow-md [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar]:w-2"
    ),
  },
  dropdownButton: {
    root: cva(
      "hover:bg-base-50 relative inline-flex w-full cursor-pointer items-center gap-x-4 text-nowrap rounded-lg border bg-transparent px-4 py-3 text-start text-sm font-medium text-current before:absolute before:inset-0 before:z-[1] disabled:pointer-events-none",
      {
        variants: {
          disabled: {
            true: "pointer-events-none opacity-50",
          },
          grouped: {
            false: "border-base-200 shadow-sm",
            true: "border-transparent",
          },
        },
        defaultVariants: {
          grouped: false,
        },
      }
    ),
    active: cva("ring-primary-500 border-primary-500"),
    label: cva("flex-1 leading-none"),
    icon: cva("size-[1em]"),
    toggle: cva("size-[0.75em] transition-all aria-checked:rotate-180"),
  },
  dropdownGroup: {
    root: cva(
      "border-base-200 mb-2 w-full border-b pb-2 first:pt-0 last:mb-0 last:border-b-0 last:pb-0"
    ),
  },

  dropdownItem: {
    root: cva(
      "text-base-800 flex w-full cursor-pointer items-center justify-start gap-x-4 text-nowrap rounded-lg px-4 py-2 text-left text-sm no-underline focus:outline-none",
      {
        variants: {
          group: {
            true: "text-base-500 cursor-default gap-x-3.5 px-3 text-xs font-medium",
          },
          disabled: {
            true: "pointer-events-none opacity-50",
          },
        },
      }
    ),
    active: cva("bg-base-100 hover:bg-base-100", {
      variants: {
        group: {
          true: "bg-base hover:bg-base",
        },
      },
    }),
    selected: cva("bg-base-100 hover:bg-base-100 cursor-default select-none"),
    label: cva("flex-1 truncate", {
      variants: {
        group: {
          true: "uppercase ",
        },
      },
    }),
    icon: cva("size-[1.25em]  flex-shrink-0", {
      variants: {
        group: {
          true: "size-[1.5em]",
        },
      },
    }),
  },
  dropdownTransitionEnter: {
    active: cva("m-0 transition duration-100 ease-out"),
    from: cva("scale-95 transform opacity-0"),
    to: cva("scale-100 transform opacity-100"),
  },
  dropdownTransitionLeave: {
    active: cva("transition duration-75 ease-in"),
    from: cva("scale-100 transform opacity-100"),
    to: cva("scale-95 transform opacity-0"),
  },
};
