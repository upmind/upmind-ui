import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const currentVariants = cva("text-md-tight", {
  variants: {
    useMonthlyFromPrice: {
      true: "flex items-baseline gap-1",
      false: ""
    }
  }
});
export const exVariants = cva("text-muted text-sm/loose font-normal");

export default {
  pricing: {
    ex: exVariants,
    current: currentVariants,
    term: cva("text-sm-loose font-normal")
  }
};
