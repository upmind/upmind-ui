import { cva, type VariantProps } from "class-variance-authority";

export const variants = {
  overflow: {
    hidden: "overflow-hidden",
    clip: "overflow-clip",
    visible: "overflow-visible"
  }
};

export const rootVariants = cva("flex w-full grow flex-col", {
  variants
});

export type RootVariants = VariantProps<typeof rootVariants>;
