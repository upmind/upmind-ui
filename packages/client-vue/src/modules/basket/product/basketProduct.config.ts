import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  product: {
    root: {
      card: cva(
        "text-foreground relative flex list-none flex-col gap-y-3 pb-6 last:pb-0",
        {
          variants: {
            isDisabled: {
              true: "pointer-events-none cursor-not-allowed!",
              false: ""
            },
            isLoading: {
              true: "",
              false: ""
            }
          },
          compoundVariants: [
            {
              isLoading: false
            }
          ]
        }
      ),
      container: cva("divide-y divide-dashed")
    },
    summary: {
      container: cva("flex flex-col gap-y-4 py-4 first:pt-0 last:pb-0"),
      image: cva(
        "m-0 h-12 max-w-12 min-w-12 rounded-lg object-cover object-center"
      ),
      imageRoute: cva("")
    },
    configDetails: {
      container: cva(
        "flex flex-col divide-y divide-solid rounded-lg border p-4 px-5 text-sm leading-3 font-medium"
      )
    },

    pricing: {
      current: cva("text-lg leading-7! font-medium md:text-xl"),
      ex: cva("text-sm! leading-5! italic")
    }
  }
};
