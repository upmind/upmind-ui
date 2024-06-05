import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  dropdown: {
    root: cva("relative inline-flex"),
    items: cva(
      "bg-base border-base-300 [&::-webkit-scrollbar-thumb]:bg-base-300 [&::-webkit-scrollbar-track]:bg-base-100 z-50 !m-0 max-h-72 min-w-full min-w-full gap-0 overflow-hidden overflow-y-auto rounded-lg border !p-0 shadow-md [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar]:w-2"
    ),
    item: cva(
      "text-base-800 !m-0 flex  min-w-full cursor-pointer items-center justify-start gap-3 text-nowrap px-2 text-left text-sm no-underline focus:outline-none",
      {
        variants: {
          size: {
            sm: "text-sm leading-5",
            md: "leading-6",
            lg: "text-lg leading-7",
          },
          group: {
            true: "text-base-500 cursor-default text-xs font-medium",
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
    activeItem: cva("bg-base-100 hover:bg-base-100", {
      variants: {
        group: {
          true: "bg-base hover:bg-base",
        },
      },
    }),
    selectedItem: cva(
      "bg-base-100 hover:bg-base-100 cursor-default select-none"
    ),
    trigger: cva(
      "hover:bg-base-50 bg-base text-base-700 relative inline-flex w-full cursor-pointer items-center gap-3 text-nowrap rounded-lg border px-2 text-start before:absolute before:inset-0 before:z-[1]",
      {
        variants: {
          size: {
            sm: "text-sm leading-5",
            md: "leading-6",
            lg: "text-lg leading-7",
          },
          disabled: {
            true: "pointer-events-none opacity-50",
          },
          grouped: {
            false: "border-base-300",
            true: "border-transparent",
          },
        },
        defaultVariants: {
          size: "md",
          grouped: false,
        },
      }
    ),
    group: cva(
      "border-base-300 mb-2 w-full border-b pb-2 first:pt-0 last:mb-0 last:border-b-0 last:pb-0"
    ),
    loading: cva("text-base-300", {
      variants: {
        size: {
          sm: "my-2 size-5",
          md: "my-3 size-6",
          lg: "my-4 size-7",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
    active: cva("!border-primary ring-primary ring-4 ring-opacity-20", {}),
    label: cva("flex-1 truncate leading-none", {
      variants: {
        size: {
          sm: "py-2 leading-5",
          md: "py-3 leading-6",
          lg: "py-4 leading-7",
        },
        group: {
          true: "pb-0",
        },
      },

      defaultVariants: {
        size: "md",
      },
    }),
    icon: cva("", {
      variants: {
        size: {
          sm: "my-2 size-5",
          md: "my-3 size-6",
          lg: "my-4 size-7",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
    avatar: cva("", {
      variants: {
        size: {
          sm: "my-2 size-5",
          md: "my-3 size-6",
          lg: "my-4 size-7",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
    toggle: cva("mr-2 transition-all aria-checked:rotate-180", {
      variants: {
        size: {
          sm: "size-4",
          md: "size-5",
          lg: "size-6",
        },
      },
    }),
    prepend: cva(
      "border-base-300 -ml-2 flex items-start self-stretch rounded-s-lg border-r ",
      {
        variants: {
          size: {
            sm: "px-3 py-2 leading-5",
            md: "px-3 py-3 leading-6",
            lg: "px-3 py-4 leading-7",
          },
        },

        defaultVariants: {
          size: "md",
        },
      }
    ),
    append: cva(
      "border-base-300 -mr-2 flex items-start self-stretch rounded-e-lg border-l ",
      {
        variants: {
          size: {
            sm: "px-3 py-2 leading-5",
            md: "px-3 py-3 leading-6",
            lg: "px-3 py-4 leading-7",
          },
        },

        defaultVariants: {
          size: "md",
        },
      }
    ),
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
