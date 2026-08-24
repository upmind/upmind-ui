// --- external
import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export const tableWrapperVariants = cva("w-0 min-w-full overflow-x-auto");
export const tableRootVariants = cva("w-full text-sm");

export const tableHeaderRootVariants = cva("");
export const tableHeaderCellVariants = cva(
  "border-stroke text-faint border-b pb-4 pl-6 text-right align-top font-medium whitespace-nowrap first:w-full first:pl-0 first:text-left first:whitespace-normal"
);
export const tableHeaderLabelVariants = cva("inline-flex items-center gap-1");
export const tableHeaderIconVariants = cva("size-5 [&>svg]:p-0.5");

export const tableBodyVariants = cva("");

export const tableRowRootVariants = cva("", {
  variants: {
    muted: { true: "text-muted" },
    lastOfGroup: { true: "border-stroke border-b" }
  }
});
export const tableRowCellVariants = cva(
  "pt-2 pl-6 text-right align-top font-normal whitespace-nowrap first:w-full first:pl-0 first:text-left first:whitespace-normal data-[emphasis=true]:font-medium [tr:first-child>&]:pt-4 [tr:last-child>&]:pb-2 [tr[data-last-of-group=true]+tr>&]:pt-4 [tr[data-last-of-group=true]>&]:pb-4",
  {
    variants: {
      compact: { true: "pt-0" },
      spaced: { true: "pb-2" },
      dashedTop: {
        true: "border-stroke border-t border-dashed pt-4"
      }
    }
  }
);

export const tableFooterRowVariants = cva("data-[muted]:text-muted");
export const tableFooterCellVariants = cva(
  "pt-2 pl-6 text-right font-normal whitespace-nowrap data-[emphasis=true]:font-medium [tr:first-child>&]:pt-4"
);

export const detailsTotalRootVariants = cva(
  "col-span-2 mt-2 flex items-center justify-between font-medium"
);
export const detailsTotalLabelVariants = cva("text-left text-xl");
export const detailsTotalValueVariants = cva(
  "flex items-center gap-2 text-right text-3xl"
);

export const detailsSkeletonRootVariants = cva("flex flex-col gap-3");
export const detailsSkeletonRowVariants = cva("flex justify-between gap-2");
export const detailsSkeletonTotalRowVariants = cva(
  "mt-2 flex items-end justify-between gap-2"
);
export const detailsSkeletonItemVariants = cva(
  "data-[width=2xl]:h-8 data-[width=2xl]:w-20 data-[width=3xl]:h-10 data-[width=3xl]:w-40 data-[width=lg]:h-5 data-[width=lg]:w-32 data-[width=md]:h-5 data-[width=md]:w-28 data-[width=sm]:h-5 data-[width=sm]:w-24 data-[width=xl]:h-5 data-[width=xl]:w-44 data-[width=xs]:h-5 data-[width=xs]:w-20"
);

// Ported from the retired order.config: the inset template already pads the
// section above, so the table only adds its own top padding elsewhere.
export const tableSectionVariants = cva("", {
  variants: {
    isInset: { true: "pt-4 md:pt-4", false: "" }
  },
  defaultVariants: { isInset: false }
});
