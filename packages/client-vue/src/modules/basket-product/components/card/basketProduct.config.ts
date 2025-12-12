import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  product: {
    root: {
      card: cva(
        "bg-surface shadow-control-default card-radius relative flex list-none flex-col gap-y-3 px-8 py-5 text-base",
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
      container: cva("divide-border-control-default divide-y divide-dashed")
    },
    summary: {
      image: cva(
        "image-radius m-0 h-12 max-w-12 min-w-12 object-cover object-center"
      )
    },
    pricing: {
      current: cva("text-lg leading-7! font-medium md:text-xl"),
      ex: cva("text-sm! leading-5! italic")
    }
  }
};
