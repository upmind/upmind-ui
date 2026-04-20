import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  product: {
    root: {
      card: cva("relative flex list-none flex-col p-0 text-base lg:p-0", {
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
      }),
      summaries: cva(
        "divide-border-control-default flex flex-col divide-y divide-dashed p-6 *:py-4 *:first:pt-0 *:last:pb-0 lg:px-8 lg:py-9"
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
        text: cva("text-xl-tight font-medium break-all no-underline")
      },
      icon: cva("[&>svg]:p-[2px]"),
      image: cva("image-radius m-0 h-12"),
      renew: {
        renews: cva("text-faint text-sm"),
        usually: cva("text-faint text-sm leading-5")
      },
      footer: {
        root: cva("flex flex-col justify-between gap-2 lg:flex-row"),
        terms: {
          root: cva("flex items-center gap-4"),
          controls: cva("flex items-center gap-2"),
          content: cva("max-h-74!")
        },
        price: {
          root: cva("flex items-end justify-between gap-4 lg:justify-end"),
          container: cva(
            "flex flex-row flex-wrap items-center gap-2 lg:flex-col lg:items-end lg:gap-0"
          )
        }
      }
    },
    option: {
      root: cva("flex w-full items-center gap-3"),
      details: cva("flex min-w-0 flex-1 flex-col"),
      title: cva("flex items-center gap-2"),
      description: cva("text-base text-sm", {
        variants: {
          selected: { true: "", false: "" },
          quantifiable: { true: "", false: "" }
        },
        compoundVariants: [
          { selected: true, quantifiable: true, class: "text-faint" }
        ]
      }),
      action: cva("w-36 shrink-0"),
      upsell: cva(
        "border-surface flex flex-col gap-4 border-t px-6 py-6 lg:px-8"
      ),
      benefits: {
        list: cva("text-muted flex flex-col gap-1 text-sm"),
        item: cva("flex items-start gap-2"),
        header: cva("flex h-lh items-center justify-center"),
        icon: cva("shrink-0 [&>svg]:size-3.5")
      }
    },
    pricing: {
      current: cva(
        "shrink-0 text-lg leading-7! font-medium whitespace-nowrap md:text-xl"
      ),
      ex: cva("text-sm! leading-5! italic")
    }
  }
};
