import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
export default {
  dialog: {
    root: cva(""),
    icon: cva("size-6 p-1"),
    wrapper: cva("fixed inset-0 overflow-y-auto"),

    content: cva(
      "flex min-h-full w-full flex-col items-center justify-center p-4 text-center"
    ),

    panel: cva(
      "bg-base text-base-content relative w-full transform overflow-hidden rounded-lg  text-left align-middle shadow-xl transition-all",
      {
        variants: {
          size: {
            sm: "max-w-sm",
            md: "max-w-md",
            lg: "max-w-lg",
            xl: "max-w-xl",
            "2xl": "max-w-4xl",
          },
        },
        defaultVariants: {
          size: "2xl",
        },
      }
    ),

    panelContent: cva(
      "flex w-full flex-col items-start justify-start gap-4 p-6"
    ),

    title: cva("m-0 font-medium leading-6 text-inherit"),
    // text-lg font-medium leading-6 text-gray-900
    text: cva("m-0 text-sm"),

    data: cva("m-0 text-xs"),

    actions: cva(""),

    close: cva(
      "!absolute right-0 top-0 !size-4 !rounded-full !p-3 [&>*>.icon]:!size-4 "
    ),
  },
};
