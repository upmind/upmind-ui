import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  summary: {
    card: cva("flex w-full flex-col items-start gap-4 divide-y divide-solid"),
    header: cva(
      "text-emphasis-medium flex w-full flex-col space-y-6 pb-4 text-sm font-medium leading-none"
    ),

    pricing: {
      root: cva(
        "text-foreground flex items-end justify-between text-lg font-medium leading-none"
      ),
      regularPrice: cva(
        "text-emphasis-medium mb-1 mt-1 block text-right text-xs line-through"
      ),
      currentPrice: cva("text-lg font-medium")
    },

    list: {
      root: cva("m-0 flex flex-col gap-y-2.5 p-6 pl-2 text-sm"),

      item: {
        root: cva(
          "text-foreground m-0 flex flex-wrap items-start gap-x-1.5 p-0"
        ),
        icon: cva(
          "text-icon mr-1 flex w-8 flex-shrink-0 items-center justify-center"
        ),
        content: cva("min-w-0 flex-1"),
        category: cva("text-emphasis-medium basis-full text-xs leading-none"),
        title: cva("text-foreground break-words font-medium"),
        quantity: cva("text-emphasis-high flex-shrink-0 text-xs")
      }
    },

    footer: cva(
      "flex w-full flex-col items-center gap-4 gap-y-6 pt-6 md:flex-row"
    ),

    skeleton: {
      root: cva("-mb-1.5 flex justify-between"),
      itemLong: cva("h-6 w-36"),
      itemShort: cva("h-6 w-24")
    }
  }
};
