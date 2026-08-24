import { cva, type VariantProps } from "class-variance-authority";

export const variants = {
  flow: {
    none: "",
    horizontal: "flex",
    vertical: "flex"
  },
  items: {
    none: "",
    between: "",
    center: "items-center",
    end: "items-end",
    start: "items-start"
  },
  justify: {
    none: "",
    between: "justify-between",
    center: "justify-center",
    end: "justify-end",
    start: "justify-start"
  },
  reverse: {
    false: "",
    true: ""
  }
};

export const containerVariants = cva("max-w-app mx-auto min-w-0 flex-1", {
  variants,
  compoundVariants: [
    {
      flow: "none",
      class: ""
    },
    {
      flow: "horizontal",
      reverse: true,
      class: "flex-col-reverse lg:flex-row"
    },
    {
      flow: "vertical",
      reverse: true,
      class: "flex-col lg:flex-col"
    },
    {
      flow: "vertical",
      reverse: false,
      class: "flex-col"
    },
    {
      flow: "horizontal",
      reverse: false,
      class: "flex-col lg:flex-row"
    }
  ],
  defaultVariants: {
    flow: "none",
    items: "none",
    justify: "none"
  }
});

export type ContainerVariants = VariantProps<typeof containerVariants>;
