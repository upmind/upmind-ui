import { cva, type VariantProps } from "class-variance-authority";

export const variants = {
  background: {
    surface: "bg-surface",
    canvas: "bg-canvas",
    LTR: "bg-surface lg:canvas-gradient",
    RTL: "bg-surface lg:canvas-gradient-rtl"
  },
  border: {
    none: "",
    top: "border-t border-stroke",
    bottom: "border-b border-stroke last:border-none"
  },
  sticky: {
    none: "",
    bottom: "sticky bottom-0",
    top: "sticky top-0"
  },
  height: {
    grow: "flex flex-1",
    auto: ""
  }
};

export const ribbonVariants = cva("w-full", {
  variants,
  defaultVariants: {
    background: "surface",
    border: "bottom",
    sticky: "bottom"
  }
});

export type RibbonVariants = VariantProps<typeof ribbonVariants>;
