import { cva, type VariantProps } from "class-variance-authority";

export const variants = {
  mode: {
    grow: "grow",
    centered: "grow items-center justify-center"
  },
  overflow: {
    hidden: "overflow-hidden",
    clip: "overflow-clip",
    visible: ""
  }
};

export const mainVariants = cva("flex w-full flex-row", {
  variants,
  defaultVariants: {
    mode: "grow",
    overflow: "visible"
  }
});

export type MainVariants = VariantProps<typeof mainVariants>;
