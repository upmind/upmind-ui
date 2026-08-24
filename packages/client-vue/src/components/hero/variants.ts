import { cva, type VariantProps } from "class-variance-authority";

// -----------------------------------------------------------------------------
// Hero variants (token utilities) — the in-component cva class-organisers
// (ADR-024 D-3, replaces the retired useStyles/*.config.ts + uiConfig shape).

export const heroRootVariants = cva("flex flex-col gap-4", {
  variants: {
    size: {
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
      "3xl": "max-w-3xl",
      "4xl": "max-w-4xl",
      app: "max-w-app",
      full: "max-w-none"
    }
  },
  defaultVariants: {
    size: "full"
  }
});

export const heroTitleVariants = cva(
  "font-display flex items-center gap-x-5 text-4xl text-balance md:text-5xl"
);
export const heroSubtitleVariants = cva("text-lg");
export const heroDescriptionVariants = cva("text-muted text-base");

export type HeroVariants = VariantProps<typeof heroRootVariants>;
