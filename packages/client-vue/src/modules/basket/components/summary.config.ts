import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  summary: {
    root: cva("flex flex-col gap-2 font-normal"),
    skeleton: cva("my-px ml-auto h-5 w-16"),
    item: {
      root: cva("flex items-center justify-between font-medium"),
      term: cva("text-xl-loose flex-shrink-0 text-left"),
      description: cva("flex items-center gap-2 text-right text-3xl"),
      skeleton: cva("my-px h-8 w-24")
    },
    // breakdown variant: per-product blocks, then adjustments
    // (discount/taxes) and the total, separated by inset dividers. gap-4
    // mirrors the pt-4 under each divider so spacing stays symmetric. Config
    // lines sit flush (line-height only).
    sections: cva("flex flex-col gap-4 font-normal"),
    products: cva("text-sm-loose flex flex-col gap-6"),
    // per-product block: priced header, optional per-unit subtitle, and the
    // configuration lines enclosed in a muted container. The container carries a
    // label + unit-price footer only when quantity > 1.
    product: {
      root: cva("flex flex-col"),
      header: cva("flex items-baseline justify-between gap-4"),
      title: cva("font-medium"),
      multiplier: cva("text-muted ml-1 font-normal"),
      total: cva("shrink-0 text-right font-medium"),
      subtitle: cva("text-muted text-sm"),
      box: cva("mt-2 flex flex-col rounded-lg p-4 text-sm", {
        variants: {
          card: {
            true: "bg-canvas",
            false: "bg-surface shadow-border-surface"
          }
        },
        defaultVariants: { card: false }
      }),
      boxLabel: cva("text-muted"),
      unitPrice: cva(
        "border-surface mt-3 flex items-baseline justify-between gap-4 border-t pt-3 font-medium"
      )
    },
    adjustments: cva(
      "text-sm-loose border-surface flex flex-col border-t pt-4"
    ),
    total: cva("border-surface border-t pt-4"),
    line: {
      root: cva("flex items-baseline justify-between gap-4"),
      label: cva(""),
      price: cva("shrink-0 text-right"),
      muted: cva("text-faint text-right"),
      quantity: cva("text-muted ml-1 font-normal")
    },
    // load-state bars. my-1 makes each bar fill the 28px sm-loose line box a
    // text row occupies; widths are a guess at the content that hasn't loaded,
    // so varied widths read as real content, not a repeated pattern.
    bars: {
      group: cva("flex flex-col"),
      row: cva("flex items-center justify-between"),
      totalRow: cva("mt-2 flex items-center justify-between"),
      total: cva("my-1.5 h-6 w-20"),
      button: cva("mt-6 h-12 w-full rounded-full"),
      w12: cva("my-1 h-5 w-12"),
      w14: cva("my-1 h-5 w-14"),
      w16: cva("my-1 h-5 w-16"),
      w20: cva("my-1 h-5 w-20"),
      w28: cva("my-1 h-5 w-28"),
      w32: cva("my-1 h-5 w-32"),
      w36: cva("my-1 h-5 w-36"),
      w40: cva("my-1 h-5 w-40"),
      w44: cva("my-1 h-5 w-44")
    }
  }
};
