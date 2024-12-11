import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export const selectVariants = cva(
  "hover:bg-control-active-hover flex items-start space-x-2 bg-control py-3 text-control-foreground transition-all duration-200",
  {
    variants: {
      layout: {
        list: "border-b border-control first:rounded-t-md last:rounded-b-md",
        grid: "data-[state=checked]:bg-control-active-background hover:data-[state=checked]:bg-control-active-hover rounded-md border border-control shadow-sm",
      },
      ring: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        layout: "grid",
        ring: true,
        className:
          "data-[state=checked]:ring-2 data-[state=checked]:ring-control-active",
      },
    ],
    defaultVariants: {
      layout: "list",
      ring: true,
    },
  }
);

// -----------------------------------------------------------------------------
export default {
  select: selectVariants,
};
