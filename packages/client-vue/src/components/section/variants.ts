import { cva, type VariantProps } from "class-variance-authority";

// -----------------------------------------------------------------------------
// Section variants (token utilities) — the in-component cva class-organisers
// (ADR-024 D-3, replaces the retired useStyles/*.config.ts + uiConfig shape).

// Inset puts the card box on the wrapper so the header sits INSIDE the card with
// its own divider. Enclosed keeps the box on the content with the header outside.
// Non-card usages are unaffected either way.
export const wrapperVariants = cva("min-w-0", {
  variants: {
    isInset: {
      false: "",
      true: "bg-surface border-stroke rounded-card border px-6 md:px-9"
    }
  },
  defaultVariants: {
    isInset: false
  }
});

// Header divider only when inset; enclosed keeps none. Disabled collapses the
// inset card to its title row, so the divider goes and the row owns its padding.
export const headerVariants = cva("items-start", {
  variants: {
    hasBorder: { false: "", true: "border-stroke border-b" },
    isInset: { false: "", true: "pt-5 md:pt-6" },
    isDisabled: { false: "", true: "" }
  },
  compoundVariants: [
    { isInset: true, isDisabled: false, class: "border-stroke border-b" },
    { isInset: true, isDisabled: true, class: "pb-5 md:pb-6" }
  ],
  defaultVariants: {
    hasBorder: false,
    isInset: false,
    isDisabled: false
  }
});

export const sectionHeadingVariants = cva(
  "text-display flex items-center gap-2 pb-4 text-sm font-medium [&_svg]:size-4",
  {
    variants: {
      isInset: { false: "", true: "" },
      isDisabled: { false: "", true: "opacity-50" }
    },
    compoundVariants: [{ isInset: true, isDisabled: true, class: "pb-0" }],
    defaultVariants: {
      isInset: false,
      isDisabled: false
    }
  }
);

export const contentVariants = cva("flex w-full flex-col gap-9", {
  variants: {
    hasCard: { false: "", true: "" },
    isInset: { false: "", true: "py-5 text-base md:py-6" }
  },
  compoundVariants: [
    {
      hasCard: true,
      isInset: false,
      class:
        "bg-surface border-stroke rounded-card border p-5 px-6 text-base md:p-8 md:px-9"
    }
  ],
  defaultVariants: {
    hasCard: false,
    isInset: false
  }
});

export const sectionContentVariants = contentVariants;

export type ContentVariants = VariantProps<typeof contentVariants>;
