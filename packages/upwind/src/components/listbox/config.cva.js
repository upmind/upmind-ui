import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  listbox: {
    root: cva("relative inline-flex"),
    items: cva(
      "bg-base border-base-200 [&::-webkit-scrollbar-thumb]:bg-base-300 [&::-webkit-scrollbar-track]:bg-base-100 z-50 !m-0 max-h-72 w-full min-w-60 space-y-0.5 overflow-hidden overflow-y-auto rounded-lg border p-1 shadow-md  [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar]:w-2"
    ),
  },
  listboxButton: {
    root: cva(
      "bg-base text-base-content border-base-200 hover:bg-base-50 relative inline-flex w-full cursor-pointer items-center  text-nowrap rounded-lg border px-4 py-3 text-start text-sm font-medium before:absolute before:inset-0 before:z-[1] disabled:pointer-events-none disabled:opacity-50 ",
      {
        variants: {
          size: {
            sm: "gap-x-3 px-3 py-2 text-sm",
            md: "gap-x-4 px-4 py-3 text-sm",
            lg: "gap-x-5 px-5 py-4 text-sm",
          },
          grouped: {
            true: "border-none",
          },
        },
        defaultVariants: {
          size: "md",
        },
      }
    ),
    active: cva("ring-base-500 border-base-500"),
    label: cva("flex-1 truncate leading-none"),
    icon: cva("size-[1em]"),
    avatar: cva("size-[1.25em] overflow-hidden rounded-full"),
    toggle: cva("size-[0.75em] transition-all aria-checked:rotate-180"),
  },
  listboxSearch: {
    input: cva(
      "border-base-300 focus-within:border-primary focus-within:ring-primary group inline-flex w-full flex-1 items-center gap-x-3 rounded-lg border bg-transparent px-3 py-2 leading-normal outline-none ring-0 focus-within:ring-4 focus-within:ring-opacity-20"
    ),
    root: cva("bg-base sticky top-[-0.25rem] -m-1 p-2 text-sm shadow-sm"),
  },

  listboxItem: {
    root: cva(
      "text-base-800 focus:bg-base-100 flex w-full cursor-pointer items-center justify-between gap-x-4 text-nowrap rounded-lg px-4 py-2 text-left text-sm no-underline focus:outline-none"
    ),
    active: cva("bg-base-100 hover:bg-base-100"),
    selected: cva("bg-base-100 hover:bg-base-100 cursor-default select-none"),
    label: cva("flex-1 truncate"),
    icon: cva("size-[1em]"),
    avatar: cva("size-[1.25em] overflow-hidden rounded-full"),
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
