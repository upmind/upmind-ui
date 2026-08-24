import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------
// Layout variants (token utilities) — the per-layout cva class-organisers
// (ADR-024 D-3, replaces the retired useStyles/*.config.ts shape). One named
// export per cva, flattening the previous nested `{ group: { element } }` map.

// --- control
export const controlRootVariants = cva(
  "border-stroke bg-surface flex w-full shrink-0 items-center justify-center self-start border-b px-6 py-4"
);
export const controlContainerVariants = cva(
  "flex w-full items-center justify-between",
  {
    variants: {
      variant: {
        default: "max-w-app",
        full: "max-w-app",
        enclosed: "max-w-app"
      }
    }
  }
);
export const controlControlsVariants = cva("grow");

// --- split
export const splitRootVariants = cva("flex min-h-screen w-full flex-row");
export const splitContainerVariants = cva(
  "bg-surface flex min-h-screen w-full flex-col justify-end gap-6 px-6 py-7 md:w-1/2 lg:px-16 lg:pt-24 lg:pb-9 2xl:px-32"
);
export const splitContentVariants = cva("");
export const splitFooterVariants = cva("h-24 lg:h-16");
export const splitAsideVariants = cva(
  "bg-canvas hidden min-h-screen md:block md:w-1/2"
);

// --- canvasCard
export const canvasCardRootVariants = cva(
  "flex w-full items-center justify-center px-6"
);
export const canvasCardContainerVariants = cva(
  "max-w-app mx-auto py-12 lg:py-24"
);
export const canvasCardHeaderVariants = cva("w-full");
export const canvasCardCardVariants = cva(
  "bg-surface rounded-card flex w-full flex-col justify-between gap-12 lg:flex-row lg:gap-32"
);
export const canvasCardContentHeaderVariants = cva("w-app-aside w-full");
export const canvasCardContentVariants = cva("w-full");

// --- surfaceBox
export const surfaceBoxRootVariants = cva(
  "bg-canvas flex w-full grow items-center justify-center"
);
export const surfaceBoxContainerVariants = cva(
  "flex w-full flex-col px-4 pt-6 pb-12 lg:px-8"
);
export const surfaceBoxHeaderVariants = cva(
  "flex w-full items-end justify-between"
);
export const surfaceBoxCardVariants = cva(
  "mx-auto flex w-full max-w-2xl flex-col justify-between"
);
export const surfaceBoxContentHeaderVariants = cva("w-full");
export const surfaceBoxContentVariants = cva("w-full");

// Inset layout — ported from the retired layout.config when develop's inset
// template arrived. The card owns the full column, so the surrounding padding
// collapses at lg rather than doubling up.
export const insetBackColumnVariants = cva("py-0 lg:py-0");
export const insetBackContentVariants = cva("pt-10 pb-0 lg:pt-10 lg:pb-0");
export const insetContentVariants = cva("", {
  variants: { centered: { true: "lg:px-0", false: "" } }
});
export const insetHeaderColumnVariants = cva("py-0 lg:py-0");
export const insetContentColumnVariants = cva("lg:pt-0", {
  variants: {
    centered: {
      true: "mx-auto w-full max-w-xl lg:px-0",
      false: "lg:pr-0"
    }
  }
});
// Drop the aside's inner (left) padding so the summary sits close to content.
export const insetAsideVariants = cva("lg:pt-0 lg:pl-0");
