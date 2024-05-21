import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

export default {
  dropdown: {
    root: cva("relative inline-flex"),
    items: cva(
      "bg-base border-base-200 [&::-webkit-scrollbar-thumb]:bg-base-300 [&::-webkit-scrollbar-track]:bg-base-100 z-50 !m-0 max-h-72 min-w-full min-w-full space-y-0.5 overflow-hidden overflow-y-auto rounded-lg border shadow-md [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar]:w-2"
    ),
  },
  dropdownButton: {
    root: cva(
      "hover:bg-base-50 bg-base text-base-700 relative inline-flex w-full cursor-pointer items-center text-nowrap rounded-lg  border text-start before:absolute before:inset-0 before:z-[1] disabled:pointer-events-none",
      {
        variants: {
          size: {
            sm: "gap-x-2 px-3 py-2 text-sm",
            md: "gap-x-3 px-3 py-3",
            lg: "gap-x-4 px-3 py-4 text-lg",
          },
          disabled: {
            true: "pointer-events-none opacity-50",
          },
          grouped: {
            false: "border-base-200",
            true: "border-transparent",
          },
        },
        defaultVariants: {
          grouped: false,
        },
      }
    ),
    loading: cva("text-base-300"),
    active: cva("ring-primary-500 border-primary-500"),
    label: cva("flex-1 leading-none"),
    icon: cva(""),
    avatar: cva(""),
    toggle: cva("size-2 transition-all aria-checked:rotate-180"),
  },
  dropdownGroup: {
    root: cva(
      "border-base-200 mb-2 w-full border-b pb-2 first:pt-0 last:mb-0 last:border-b-0 last:pb-0"
    ),
  },

  dropdownItem: {
    root: cva(
      "text-base-800 flex min-w-full cursor-pointer items-center justify-start text-nowrap rounded-lg text-left text-sm no-underline focus:outline-none",
      {
        variants: {
          size: {
            sm: "gap-x-2 px-3 py-2 text-sm",
            md: "gap-x-3 px-3 py-3",
            lg: "gap-x-4 px-3 py-4 text-lg",
          },
          group: {
            true: "text-base-500 cursor-default gap-x-3.5 px-3 text-xs font-medium",
          },
          disabled: {
            true: "pointer-events-none opacity-50",
          },
        },
        defaultVariants: {
          size: "md",
          group: false,
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
    label: cva("block max-w-60 flex-1 truncate", {
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
