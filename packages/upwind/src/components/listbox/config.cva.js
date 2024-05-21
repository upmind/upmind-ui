import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  listbox: {
    root: cva("relative inline-flex"),
    items: cva(
      "bg-base border-base-200 [&::-webkit-scrollbar-thumb]:bg-base-300 [&::-webkit-scrollbar-track]:bg-base-100 z-50 !m-0 max-h-72 min-w-full min-w-full space-y-0.5 overflow-hidden overflow-y-auto rounded-lg border shadow-md [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar]:w-2"
    ),
  },
  listboxButton: {
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
          size: "md",
          grouped: false,
        },
      }
    ),
    loading: cva("text-base-300"),
    active: cva("ring-primary-500 border-primary-500"),
    label: cva("flex-1 truncate leading-none"),
    icon: cva(""),
    avatar: cva(""),
    toggle: cva("size-2 transition-all aria-checked:rotate-180"),
  },
  listboxSearch: {
    input: cva(
      "border-base-300 focus-within:border-primary focus-within:ring-primary group inline-flex w-full flex-1 items-center gap-x-3 rounded-lg border bg-transparent px-3 py-2 leading-normal outline-none ring-0 focus-within:ring-4 focus-within:ring-opacity-20"
    ),
    root: cva("bg-base sticky top-[-0.25rem] -m-1 p-2 text-sm shadow-sm"),
  },

  listboxItem: {
    root: cva(
      "text-base-800 flex min-w-full cursor-pointer items-center justify-start text-nowrap text-left text-sm no-underline focus:outline-none",
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
    selected: cva("bg-base-100 hover:bg-base-100 cursor-default select-none "),
    label: cva("block max-w-60 flex-1 truncate", {
      variants: {
        group: {
          true: "uppercase ",
        },
      },
    }),
    icon: cva("ml-2 size-3 flex-shrink-0"),
  },
  listboxTransitionEnter: {
    active: cva("m-0 transition duration-100 ease-out"),
    from: cva("scale-95 transform opacity-0"),
    to: cva("scale-100 transform opacity-100"),
  },
  listboxTransitionLeave: {
    active: cva("transition duration-75 ease-in"),
    from: cva("scale-100 transform opacity-100"),
    to: cva("scale-95 transform opacity-0"),
  },
};
