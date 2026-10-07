import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------
// Basket-product variants (token utilities) — the in-component cva
// class-organiser (ADR-024 D-3, replaces the retired useStyles/*.config.ts).

export const basketProductActionsVariants = cva(
  "flex w-full flex-col gap-6 font-medium lg:flex-row"
);
