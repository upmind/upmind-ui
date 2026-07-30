import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  product: {
    list: cva("flex flex-col gap-4"),
    // Multi-product container. `card: false` renders products flat inside a
    // shared parent card, separated with the same dashed rhythm used for the
    // pricing sub-rows; each own-card product stays a distinct card (gap-4).
    items: cva("flex flex-col", {
      variants: {
        card: {
          true: "gap-4",
          false:
            "divide-border-control-default divide-y divide-dashed *:py-6 *:first:pt-0 *:last:pb-0"
        }
      },
      defaultVariants: { card: true }
    }),
    // The product's own container: an own Card, or a flat div inside a parent
    // card (e.g. "Your Order"). Flat drops the card chrome; gap-9 keeps the
    // summary-to-config spacing the per-product card used to provide.
    container: cva("", {
      variants: {
        card: {
          true: "relative flex list-none flex-col p-0 text-base lg:p-0",
          false: "flex flex-col gap-9"
        },
        isDisabled: {
          true: "",
          false: ""
        }
      },
      compoundVariants: [
        {
          card: true,
          isDisabled: true,
          class: "pointer-events-none cursor-not-allowed!"
        }
      ],
      defaultVariants: { card: true }
    }),
    // pricing summary rows; an own-card product carries its own inset, a flat
    // one inherits the parent card's padding (keeps the inter-item rhythm).
    summaries: cva(
      "divide-border-control-default flex flex-col divide-y divide-dashed *:py-4 *:first:pt-0 *:last:pb-0",
      {
        variants: {
          card: {
            true: "p-6 lg:px-8 lg:py-9",
            false: ""
          }
        },
        defaultVariants: { card: true }
      }
    ),
    // inline config sits below the summary; an own-card product keeps its
    config: cva("empty:hidden", {
      variants: {
        card: {
          true: "px-6 pb-6 md:pb-9 lg:px-8",
          false: ""
        }
      },
      defaultVariants: { card: true }
    }),
    tax: cva("text-faint text-sm leading-5"),
    summary: {
      article: cva("flex flex-col gap-4"),
      header: {
        root: cva("flex items-start gap-3"),
        content: cva("w-full"),
        top: cva("flex justify-between")
      },
      category: {
        root: cva("flex items-center gap-2"),
        text: cva("text-faint text-sm font-normal")
      },
      title: {
        root: cva("flex items-start justify-between gap-x-4"),
        group: cva("flex items-center gap-2"),
        link: cva("no-underline"),
        text: cva("text-xl-tight font-medium break-all no-underline")
      },
      icon: cva("[&>svg]:p-[2px]"),
      image: cva("image-radius m-0 size-13"),
      renew: {
        renews: cva("text-faint text-sm"),
        usually: cva("text-faint text-sm-tight")
      },
      footer: {
        root: cva("flex flex-col justify-between gap-2 lg:flex-row"),
        terms: {
          root: cva("flex flex-wrap items-center gap-x-4 gap-y-2"),
          controls: cva("flex items-center gap-2"),
          content: cva("max-h-74!"),
          trigger: cva("[&>i]:ml-0 [&>i]:pl-1"),
          price: cva("ml-3 text-sm")
        },
        remove: cva("p-2 [&>span>i>svg]:size-4")
      }
    },
    option: {
      root: cva("flex w-full flex-col gap-4 md:flex-row md:items-center"),
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
      discounted: cva("text-muted line-through"),
      action: cva("w-full shrink-0 md:w-36"),
      upsell: cva("border-surface flex flex-col gap-4 border-t", {
        variants: {
          card: {
            true: "px-6 py-6 lg:px-8",
            false: "pt-6"
          }
        },
        defaultVariants: { card: true }
      }),
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
      ex: cva("text-sm leading-5")
    },
    skeleton: {
      image: cva("image-radius m-0 h-12 w-12 shrink-0"),
      stack: cva("flex w-full flex-col gap-1"),
      category: cva("h-5 w-24"),
      title: {
        row: cva("flex items-start justify-between gap-2"),
        // Narrower on mobile so the image + title + price row fits the
        // configurable card's doubly-padded width; full title length at md+.
        text: cva("h-6 w-24 md:w-48")
      },
      price: cva("h-6 w-24 shrink-0"),
      controls: cva("flex flex-wrap items-center gap-x-3 gap-y-2"),
      quantity: cva("h-10 w-12"),
      renew: cva("h-5 w-28")
    }
  }
};
