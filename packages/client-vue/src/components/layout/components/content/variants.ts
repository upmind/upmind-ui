import { cva, type VariantProps } from "class-variance-authority";

export const variants = {
  sticky: {
    none: "",
    top: "sticky top-0",
    bottom: "sticky bottom-0"
  },
  oversized: {
    true: "static",
    false: ""
  },
  width: {
    auto: "",
    full: "w-full",
    aside: "lg:min-w-app-aside lg:max-w-app-aside",
    asidelg: "lg:min-w-app-aside-lg lg:max-w-app-aside-lg"
  },
  flow: {
    none: "",
    horizontal: "flex",
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
  gap: {
    none: "",
    sm: "gap-6",
    md: "gap-12",
    lg: "gap-18"
  },
  padding: {
    true: "lg:p-6",
    false: "lg:px-6"
  },
  height: {
    auto: "",
    full: "h-full"
  }
};

export const contentVariants = cva("w-full min-w-0 [&>*]:min-w-0", {
  variants,
  defaultVariants: {
    flow: "none",
    justify: "none",
    items: "none",
    gap: "md",
    width: "auto"
  }
});

export type ContentVariants = VariantProps<typeof contentVariants>;
