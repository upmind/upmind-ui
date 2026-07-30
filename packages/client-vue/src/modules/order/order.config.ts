// --- external
import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------
export default {
  table: {
    // An inset section's py-5/md:py-6 overshoots the pb-4 under the table
    // header, so match it.
    section: cva("", {
      variants: {
        isInset: { true: "pt-4 md:pt-4", false: "" }
      },
      defaultVariants: { isInset: false }
    }),
    wrapper: cva("w-0 min-w-full overflow-x-auto"),
    root: cva("w-full text-sm"),
    header: {
      root: cva(""),
      cell: cva(
        "border-control-default text-faint border-b pb-4 pl-6 text-right align-top font-medium whitespace-nowrap first:w-full first:pl-0 first:text-left first:whitespace-normal"
      ),
      label: cva("inline-flex items-center gap-1"),
      icon: cva("size-5 [&>svg]:p-0.5")
    },
    body: cva(""),
    row: {
      root: cva("", {
        variants: {
          muted: { true: "text-muted" },
          lastOfGroup: { true: "border-control-default border-b" }
        }
      }),
      cell: cva(
        "pt-2 pl-6 text-right align-top font-normal whitespace-nowrap first:w-full first:pl-0 first:text-left first:whitespace-normal data-[emphasis=true]:font-medium [tr:first-child>&]:pt-4 [tr:last-child>&]:pb-2 [tr[data-last-of-group=true]+tr>&]:pt-4 [tr[data-last-of-group=true]>&]:pb-4",
        {
          variants: {
            compact: { true: "pt-0" },
            spaced: { true: "pb-2" },
            dashedTop: {
              true: "border-control-default border-t border-dashed pt-4"
            }
          }
        }
      )
    },
    footer: {
      row: cva("data-[muted]:text-muted"),
      cell: cva(
        "pt-2 pl-6 text-right font-normal whitespace-nowrap data-[emphasis=true]:font-medium [tr:first-child>&]:pt-4"
      )
    }
  },
  details: {
    total: {
      root: cva("mt-2 flex items-center justify-between font-medium"),
      label: cva("text-xl-loose text-left"),
      value: cva("flex items-center gap-2 text-right text-3xl")
    },
    skeleton: {
      root: cva("flex flex-col gap-3"),
      row: cva("flex justify-between gap-2"),
      totalRow: cva("mt-2 flex items-end justify-between gap-2"),
      item: cva(
        "data-[width=2xl]:h-8 data-[width=2xl]:w-20 data-[width=3xl]:h-10 data-[width=3xl]:w-40 data-[width=lg]:h-5 data-[width=lg]:w-32 data-[width=md]:h-5 data-[width=md]:w-28 data-[width=sm]:h-5 data-[width=sm]:w-24 data-[width=xl]:h-5 data-[width=xl]:w-44 data-[width=xs]:h-5 data-[width=xs]:w-20"
      )
    }
  }
};
