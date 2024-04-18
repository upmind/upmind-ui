import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  checkbox: {
    root: cva("relative inline-block shrink-0", {
      variants: {
        size: {
          sm: "size-4 text-sm",
          md: "size-5",
          lg: "size-6 text-lg",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
    input: cva(
      "border-base-300 focus:border-primary focus:ring-primary size-full appearance-none rounded border outline-none ring-0 focus:ring-4 focus:ring-opacity-20",
      {
        variants: {
          isDisabled: {
            true: "bg-base-100 ",
          },
          isChecked: {
            true: `bg-base-content border-base-content focus:border-primary focus:ring-primary text-base focus:ring-4 focus:ring-opacity-20`,
          },
        },
      }
    ),
    icon: cva(
      "pointer-events-none absolute bottom-0 left-0 right-0 top-0 m-auto",
      {
        variants: {
          size: {
            sm: "size-2",
            md: "size-3",
            lg: "size-4",
          },
          isDisabled: {
            true: "text-base-content",
          },
          isChecked: {
            true: `text-base`,
          },
        },
        defaultVariants: {
          size: "md",
        },
      }
    ),
  },
};
