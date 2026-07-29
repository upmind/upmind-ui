import { cva } from "class-variance-authority";

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
    between: "items-between",
    center: "items-center",
    end: "items-end",
    start: "items-start"
  },
  gap: {
    true: "gap-6",
    false: ""
  },
  background: {
    none: "",
    surface: "bg-surface",
    canvas: "bg-canvas"
  },
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

export default {
  column: cva("flex", {
    variants,
    defaultVariants: {
      flow: "vertical",
      justify: "none",
      items: "none",
      gap: true,
      background: "none",
      padding: "md"
    }
  })
};
