import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  client: {
    root: cva("flex w-full flex-col"),
    header: cva(""),
    loading: cva(""),
    footer: cva(""),
    title: cva("flex items-center justify-between gap-4"),
    content: cva("flex flex-col gap-4 rounded-lg"),
    actions: cva("flex gap-2"),
  },
  clientListings: {
    root: cva("bg-base w-full"),
    footer: cva("flex-row items-center justify-between gap-x-4"),
    items: cva("grid gap-4 p-1", {
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
    root: cva("bg-base w-full"),
    footer: cva("flex-row items-center justify-between gap-x-4"),
    loading: cva(""),
    content: cva("bg-base mx-auto w-full py-8", {
      variants: {
        hasErrors: {
          true: "border-error",
        },
      },
    }),
    title: cva("m-0 flex-1 text-inherit"),
    text: cva("m-0 flex-1 text-xs"),
    errors: cva("text-error m-0 text-sm"),
  },
  clientCard: {
    root: cva(
      "flex items-start gap-2 rounded-lg border border-transparent transition",
      {
        variants: {
          isSelectable: {
            true: "cursor-pointer p-2",
            false: "",
          },
          isSelected: {
            true: "",
            false: "",
          },

          isEditing: {
            true: "bg-base-muted",
            false: "",
          },
          isHidden: {
            true: "pointer-events-none hidden opacity-50",
            false: "",
          },
          hasErrors: {
            true: "border-error",
            false: "",
          },
        },
        compoundVariants: [
          {
            hasErrors: false,
            isSelectable: true,
            isSelected: true,
            class:
              "border-control-active ring-control-active ring-4 ring-opacity-20",
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
            class: "cursor-pointer",
          },
        ],
      }
    ),
    content: cva("text-base-700 flex flex-1 flex-col gap-1 text-sm"),
    header: cva("flex items-center justify-start gap-4"),
    icon: cva("size-4"),
    avatar: cva("size-6 overflow-hidden rounded-full border"),
    title: cva(
      "text-md text-base-foreground m-0 inline-flex gap-1 font-normal leading-none"
    ),
    text: cva("leading-tight"),
    verified: cva("", {
      variants: {
        isVerified: {
          true: "text-success",
          false: "text-warning",
        },
      },
    }),
    errors: cva("text-error m-0 text-sm"),
    actions: cva("flex items-center justify-end gap-2 self-start"),
  },
  clientEmpty: {
    root: cva(
      "bg-base-muted flex flex-col items-center justify-center gap-4 rounded-lg p-4"
    ),
    title: cva("m-0 text-inherit"),
    text: cva("text-base-700 m-0 text-center"),
    icon: cva("text-base-700 size-8"),
  },
};
