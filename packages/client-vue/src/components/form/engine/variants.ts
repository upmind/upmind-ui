import { cva, type VariantProps } from "class-variance-authority";
// -----------------------------------------------------------------------------
// Form host layout variants — ported from the old lib's form.config.ts off
// useStyles (FE-2941 / Phase-6 pattern: named cva exports bound via cn at the
// call-site). The old `input`/`loading` config entries were vestigial and dropped.

/** Size axis — no size-specific classes yet (placeholder; matches the old lib). */
export const formVariants = cva("", {
  variants: {
    size: { sm: "", md: "", lg: "", xl: "" }
  }
});
export type FormVariants = VariantProps<typeof formVariants>;

export const formRootVariants = cva("relative flex w-full flex-col gap-6");

export const formWrapperVariants = cva("w-full space-y-4");

export const formDescriptionVariants = cva(
  "text-muted w-full text-sm font-normal"
);

export const formContentVariants = cva("transition-opacity duration-200", {
  variants: {
    disabled: { true: "cursor-not-allowed" },
    processing: { true: "cursor-wait duration-0" },
    loading: { true: "invisible opacity-0 duration-0" }
  },
  defaultVariants: { disabled: false, processing: false, loading: false }
});

export const formActionsVariants = cva(
  "flex w-full flex-wrap gap-2 transition-all duration-200",
  {
    variants: {
      disabled: { true: "cursor-not-allowed" },
      processing: { true: "cursor-wait" },
      loading: { true: "invisible opacity-0 duration-0" }
    }
  }
);
