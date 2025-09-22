import { cva } from "class-variance-authority";

const rootVariants = cva("flex w-full items-center gap-2", {
  variants: {
    size: {
      sm: "gap-1",
      md: "gap-2",
      lg: "gap-3"
    },
    alignment: {
      left: "justify-start",
      center: "justify-center",
      between: "md:justify-between"
    }
  },
  defaultVariants: {
    size: "md",
    alignment: "between"
  }
});

const buttonVariants = cva("w-full flex-1", {
  variants: {
    size: {
      sm: "md:w-48 md:flex-none",
      md: "md:w-56 md:flex-none",
      lg: "md:w-64 md:flex-none"
    }
  },
  defaultVariants: {
    size: "md"
  }
});

const infoVariants = cva("text-text-muted hidden text-sm md:inline-block", {
  variants: {
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base"
    }
  },
  defaultVariants: {
    size: "md"
  }
});

export default {
  pagination: {
    root: rootVariants,
    button: buttonVariants,
    info: infoVariants
  }
};

export { rootVariants, buttonVariants, infoVariants };
