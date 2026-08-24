import { cva, type VariantProps } from "class-variance-authority";

// Column variants (token utilities) + the in-component cva class-organiser
// (ADR-024 D-3 — replaces the retired useStyles/*.config.ts shape). The raw
// `variants` map feeds prop-type derivation (parseVariants) in ./types.ts;
// `columnVariants` is the component's organiser. `hide`/`show` are the
// responsive-visibility orphan behaviours, now plain prop-driven variants.
export const variants = {
  width: {
    auto: "",
    // full-width (content) columns shrink so scroll containers inside them (e.g.
    // section tabs) bound to the viewport; auto columns (asides) keep their width.
    full: "w-full min-w-0"
  },
  flow: {
    horizontal: "flex flex-col lg:flex-row",
    vertical: "flex flex-col"
  },
  justify: {
    none: "",
    between: "justify-between",
    center: "justify-center",
    end: "justify-end",
    start: "justify-start"
  },
  items: {
    none: "",
    between: "",
    center: "items-center",
    end: "items-end",
    start: "items-start"
  },
  gap: { true: "gap-6", false: "" },
  background: { none: "", surface: "bg-surface", canvas: "bg-canvas" },
  padding: {
    none: "",
    sm: "p-6 px-6 lg:p-6",
    md: "p-12 px-6 lg:p-12",
    lg: "p-18 px-6 lg:p-18"
  },
  hide: {
    never: "",
    sm: "sm:flex",
    md: "md:flex",
    lg: "lg:flex",
    always: "hidden"
  },
  show: {
    never: "hidden",
    sm: "hidden sm:flex",
    md: "hidden md:flex",
    lg: "hidden lg:flex",
    always: ""
  }
};

export const columnVariants = cva("flex", {
  variants,
  defaultVariants: {
    flow: "vertical",
    justify: "none",
    items: "none",
    gap: true,
    background: "none",
    padding: "md"
  }
});

export type ColumnVariants = VariantProps<typeof columnVariants>;
