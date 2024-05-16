import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  combobox: {
    root: cva("relative w-full"),
    value: cva(
      "truncate bg-transparent leading-normal", //placeholder:absolute placeholder:top-1/2 placeholder:-translate-y-1/2 placeholder:transform
      {
        variants: {
          size: {
            sm: "py-2 pl-3 text-sm leading-5",
            md: "py-3 pl-3 leading-6",
            lg: "py-4 pl-3 text-lg leading-7",
          },
        },
        defaultVariants: {
          size: "md",
        },
      }
    ),
    input: cva(
      " flex-1 resize-none bg-transparent leading-normal outline-none", //placeholder:absolute placeholder:top-1/2 placeholder:-translate-y-1/2 placeholder:transform
      {
        variants: {
          size: {
            sm: "px-3 py-2 text-sm leading-5",
            md: "px-3 py-3 leading-6",
            lg: "px-3 py-4 text-lg leading-7",
          },
        },
        defaultVariants: {
          size: "md",
        },
      }
    ),
    button: cva(
      "inline-flex cursor-pointer items-center self-center text-nowrap rounded-lg px-4 py-3 text-sm font-medium leading-tight text-current",
      {
        variants: {
          size: {
            sm: "gap-x-3  px-3 py-2 text-xs leading-5",
            md: "gap-x-3  px-3 py-3 text-xs leading-6",
            lg: "gap-x-3  px-3 py-4 text-xs leading-7",
          },
        },
        defaultVariants: {
          size: "md",
        },
      }
    ),
    toggle: cva("size-[0.75em] transition-all", {
      variants: {
        size: {
          sm: "size-2 leading-5",
          md: "size-3 leading-6",
          lg: "size-4 leading-7",
        },
        toggleRotate: {
          true: "aria-checked:rotate-180",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
    items: cva(
      "[&::-webkit-scrollbar-thumb]:bg-base-300 [&::-webkit-scrollbar-track]:bg-base-100 z-50 !m-0 max-h-72 w-full min-w-60 space-y-0.5 overflow-hidden overflow-y-auto rounded-lg  p-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar]:w-2",
      {
        variants: {
          isProcessing: {
            false: "border-base-200 bg-base border shadow-md",
            true: "border-none bg-transparent shadow-none",
          },
        },
      }
    ),
  },

  comboboxItem: {
    root: cva(
      "text-base-800 focus:bg-base-100 flex w-full cursor-pointer items-center justify-between gap-x-4 text-nowrap rounded-lg px-4 py-2 text-left text-sm no-underline focus:outline-none"
    ),
    separator: cva(
      "text-base-500 border-base-200 mb-2 flex w-full items-center justify-between gap-x-4 text-nowrap border-b px-4 py-2 text-left text-xs font-medium no-underline"
    ),
    active: cva("bg-base-100 hover:bg-base-100"),
    selected: cva("bg-base-100 hover:bg-base-100 cursor-default select-none"),
    label: cva("flex-1 truncate"),
    icon: cva("size-[1em]"),
    avatar: cva("size-[1.25em] overflow-hidden rounded-full"),
  },

  comboboxTransitionEnter: {
    active: cva("m-0 transition duration-100 ease-out"),
    from: cva("scale-95 transform opacity-0"),
    to: cva("scale-100 transform opacity-100"),
  },
  comboboxTransitionLeave: {
    active: cva("transition duration-75 ease-in"),
    from: cva("scale-100 transform opacity-100"),
    to: cva("scale-95 transform opacity-0"),
  },
};
