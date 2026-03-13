import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  product: {
    root: {
      card: cva(
        "divide-border-control-default relative flex list-none flex-col divide-y divide-dashed text-base *:py-4 *:first:pt-0 *:last:pb-0 lg:px-8 lg:py-9",
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
      )
    },
    summary: {
      article: cva("flex flex-col gap-2 lg:gap-4"),
      header: {
        root: cva("flex gap-3"),
        content: cva("w-full"),
        top: cva("flex justify-between")
      },
      category: {
        root: cva("flex items-center gap-2"),
        text: cva("text-faint text-sm font-normal")
      },
      title: {
        root: cva("flex items-center gap-2"),
        link: cva("no-underline"),
        text: cva("text-xl-tight font-medium break-all")
      },
      icon: cva("[&>svg]:p-[2px]"),
      image: cva("image-radius m-0 h-12"),
      footer: {
        root: cva("flex flex-col justify-between gap-2 lg:flex-row"),
        price: {
          root: cva("flex items-end justify-between gap-4 lg:justify-end"),
          container: cva(
            "flex flex-row flex-wrap items-center gap-2 lg:flex-col lg:items-end lg:gap-0"
          )
        }
      }
    },
    option: {
      root: cva("flex items-center justify-between"),
      footer: cva("flex flex-col items-end")
    },
    pricing: {
      current: cva("text-lg leading-7! font-medium md:text-xl"),
      ex: cva("text-sm! leading-5! italic")
    }
  }
};
