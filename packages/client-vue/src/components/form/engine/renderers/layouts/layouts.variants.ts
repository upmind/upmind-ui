import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
// Layout/Group renderer variants — ported off useStyles/layouts.config.ts
// (FE-2941 / Phase-6 pattern). Old-lib tokens mapped to new-lib utilities
// (text-base-500 → text-muted, border-control-default → border-stroke).

export const groupRootVariants = cva("flex flex-col space-y-2", {
  variants: {
    hasBorder: { true: "border-stroke border-t pt-4" }
  }
});
export const groupLabelVariants = cva("text-muted w-full text-xs font-medium");
export const groupItemVariants = cva("");

export const layoutRootVariants = cva("flex w-full", {
  variants: {
    isHorizontal: {
      true: "flex-col space-y-4 md:flex-row md:flex-wrap md:space-y-0 md:space-x-4",
      false: "flex-col space-y-4"
    }
  }
});
export const layoutItemVariants = cva(
  "w-full empty:hidden data-[visible='false']:hidden",
  {
    variants: {
      isHorizontal: { true: "md:flex-1", false: "" }
    }
  }
);
