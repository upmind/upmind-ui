import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  summary: {
    pricing: {
      total: cva("text-xl-loose text-left"),
      price: cva("items-center justify-between font-medium", {
        variants: {
          footer: {
            false: "mt-4 flex",
            true: "hidden lg:flex"
          }
        }
      }),
      regularPrice: cva("text-muted text-right text-xs line-through"),
      currentPrice: cva("flex items-center gap-2 text-right text-3xl")
    },

    list: {
      root: cva("m-0 flex flex-col gap-y-2.5 text-sm"),

      item: {
        root: cva("flex list-none justify-between text-sm"),
        category: cva("text-muted font-normal"),
        title: cva("font-normal")
      }
    },

    footer: cva("flex w-full flex-col items-center gap-4 gap-y-6 md:flex-row"),

    skeleton: {
      root: cva("-mb-1.5 flex justify-between"),
      itemLong: cva("h-6 w-36"),
      itemShort: cva("h-6 w-24")
    }
  }
};
