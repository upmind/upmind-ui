import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  client: {
    root: cva("w-full flex flex-col gap-4"),
    header: cva(""),
    footer: cva(""),
    loading: cva(""),
    actions: cva(""),
  },
  clientListings: {
    root: cva("w-full flex flex-col gap-4 "),
    header: cva(""),
    footer: cva(""),
    items: cva("grid gap-4", {
      variants: {
        cols: {
          full: "grid-cols-1",
          1: "grid-cols-1",
          2: "grid-cols-2",
          3: "grid-cols-3",
          4: "grid-cols-4",
          6: "grid-cols-6",
        },
      },
      defaultVariants: {
        cols: 1,
      },
    }),
    loading: cva(""),
    actions: cva(""),
  },
  clientForm: {
    root: cva("w-full mt-4 max-w-xl", {
      variants: {
        hasErrors: {
          true: "border-error",
        },
        isComplete: {
          true: "border-primary",
        },
      },
    }),
    title: cva("text-inherit m-0 flex-1"),
    text: cva("text-xs m-0 flex-1"),
  },
  clientCard: {
    root: cva(
      "rounded-lg flex items-start gap-2 border border-transparent transition",
      {
        variants: {
          isSelectable: {
            true: "cursor-pointer p-2",
          },

          isEditing: {
            true: "bg-base-200",
          },
          isHidden: {
            true: "hidden opacity-50 pointer-events-none",
          },
          hasErrors: {
            true: "border-error",
          },
        },
        compoundVariants: [
          {
            hasErrors: false,
            isSelectable: true,
            isSelected: true,
            class: "border-primary border-2",
          },
          {
            hasErrors: false,
            isSelectable: true,
            isSelected: false,
            class: "p-[9px]", // HACK: (p2 + 1px) to prevent bounce on the border size changing
          },
          {
            isSelected: false,
            isSelectable: true,
            class: "hover:border-base-100 hover:bg-base-100",
          },
        ],
      }
    ),
    content: cva("flex-1 text-xs text-base-500 flex flex-col gap-1", {}),
    header: cva("flex gap-4 items-center justify-start"),
    icon: cva("size-4"),
    avatar: cva("size-6 rounded-full border overflow-hidden "),
    title: cva(
      "m-0 leading-none text-sm text-base-content gap-2 inline-flex font-medium"
    ),
    text: cva("leading-tight "),
    verified: cva("", {
      variants: {
        isVerified: {
          true: "text-success",
          false: "text-warning",
        },
      },
    }),
    errors: cva("text-error text-sm m-0"),
    actions: cva("flex gap-2 items-center justify-end self-start"),
  },
  clientEmpty: {
    root: cva(
      "flex flex-col items-center justify-center gap-4 p-4 bg-base-100 rounded-lg"
    ),
    title: cva("text-inherit m-0"),
    text: cva("text-base-700 text-center m-0"),
    icon: cva("size-8 text-base-500"),
  },
  clientRadio: {
    radio: {
      input: cva("", {
        variants: {
          isChecked: {
            true: `bg-primary border-primary text-base`,
          },
        },
      }),
    },
  },
  clientDetails: {
    root: cva("w-full flex flex-col gap-4"),
    header: cva(""),
    loading: cva(""),
    footer: cva(""),
    title: cva("flex justify-between items-center gap-4"),
    content: cva("flex flex-col gap-4 border border-base-200 rounded-lg p-4"),
    actions: cva(""),
  },
};
