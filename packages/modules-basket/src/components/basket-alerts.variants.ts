import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------
// Basket-alerts variants (token utilities) — the in-component cva
// class-organisers (ADR-024 D-3, replaces the retired useStyles/*.config.ts).

export const basketAlertsRootVariants = cva("flex flex-col gap-2");
export const basketAlertsListVariants = cva(
  "list-disc pl-3.5 text-left text-sm"
);
export const basketAlertsItemVariants = cva("text-sm marker:text-inherit");
