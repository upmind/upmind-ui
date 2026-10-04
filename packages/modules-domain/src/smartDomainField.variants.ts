import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------
// SmartDomainField variants (ADR-024 D-3 — replaces the retired
// useStyles/smartDomainField.config.ts shape). One named export per cva, nested
// keys flattened. Classes copied verbatim from smartDomainField.config.ts.

// --- field
export const fieldRootVariants = cva("flex w-full flex-col gap-1");
export const fieldContainerVariants = cva(
  "bg-surface rounded-card shadow-card focus-within:ring-ring/15 aria-invalid:border-danger aria-invalid:focus-within:ring-danger/20 border-stroke border transition focus-within:border-(--border-control-selected) focus-within:ring-[3px] hover:border-(--border-control-hover) data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
);
export const fieldContentVariants = cva(
  "flex w-full flex-col items-start gap-1 px-4 py-3"
);
export const fieldOptionVariants = cva(
  "flex w-fit cursor-pointer items-start gap-3"
);
export const fieldIndicatorVariants = cva("flex h-7 items-center");
export const fieldLabelVariants = cva(
  "cursor-pointer text-sm leading-7 font-medium"
);
export const fieldExpandedVariants = cva(
  "flex w-full flex-col gap-1 py-2 pl-7",
  {
    variants: {
      hasInfo: {
        true: "gap-3",
        false: ""
      }
    }
  }
);
export const fieldDomainVariants = cva("px-0 md:px-0");

// --- field.transfer
export const fieldTransferRootVariants = cva(
  "flex w-full flex-col items-start gap-2 lg:flex-row lg:flex-wrap lg:gap-x-12 lg:gap-y-2"
);
export const fieldTransferTextVariants = cva(
  "text-muted flex-1 text-sm leading-6"
);

// --- field.summary
export const fieldSummaryRootVariants = cva(
  "bg-surface rounded-card shadow-card border-stroke border data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
);
export const fieldSummaryRowVariants = cva("flex items-start gap-3 px-4 py-3");
export const fieldSummaryIndicatorVariants = cva(
  "flex size-[1lh] items-center justify-center"
);
export const fieldSummaryContentVariants = cva(
  "flex min-w-40 flex-1 flex-wrap items-center gap-x-4 gap-y-1"
);
export const fieldSummaryDomainVariants = cva(
  "text-display text-sm font-medium"
);
export const fieldSummaryChangeVariants = cva(
  "ml-auto shrink-0 cursor-pointer text-sm leading-6 font-normal text-(--text-button-link) underline aria-disabled:opacity-100"
);
