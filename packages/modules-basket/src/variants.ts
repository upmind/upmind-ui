import { cva, type VariantProps } from "class-variance-authority";

// -----------------------------------------------------------------------------
// Basket variants (token utilities) — the in-component cva class-organisers
// (ADR-024 D-3, replaces the retired useStyles/*.config.ts + uiConfig shape).

// `variant` keyed full/enclosed only; the empty two-column entries let callers
// pass the full BASKET_TEMPLATE union to the direct cva call (behaviour
// identical — unmatched templates resolve to the base classes).
export const basketAsideVariants = cva("", {
  variants: {
    variant: {
      full: "gap-9",
      enclosed: "gap-6",
      "two-column-ltr": "",
      "two-column-rtl": "",
      inset: ""
    }
  }
});

export const basketCustomFieldsRootVariants = cva("");

// Promotions form-config tree (passed wholesale as the Form's `uiConfig`). The
// old-lib Form only reads `form.{root,actions}`; the remaining keys are
// vestigial but preserved verbatim for shape parity.
export const promotionsVariants = {
  root: cva("flex w-full flex-col gap-3 text-left"),
  header: cva(),
  toggle: cva("size-3 transition-all aria-checked:rotate-180"),
  title: cva("sr-only"),
  content: cva(),
  footer: cva("flex flex-wrap items-center gap-1"),
  form: {
    root: cva("flex-row items-start gap-2"),
    actions: cva("w-auto items-start")
  },
  input: cva("w-20")
};

export type BasketAsideVariants = VariantProps<typeof basketAsideVariants>;
