import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const variants = {
  variant: {
    solid: ""
  },
  color: {
    danger: "bg-accent-danger text-accent-danger-contrast",
    warning: "bg-accent-warning text-accent-warning-contrast"
  }
};

export const rootVariants = cva("text-md w-full font-medium", {
  variants,
  defaultVariants: {
    variant: "solid",
    color: "danger"
  }
});

export default {
  banner: {
    root: rootVariants,
    container: cva(
      "mx-auto flex w-full items-center justify-between px-5 py-4"
    ),
    spacer: "size-lh shrink-0",
    content: cva("flex-1 text-center"),
    action: cva(
      "size-lh flex shrink-0 cursor-pointer items-center justify-center"
    ),
    icon: cva("[&>svg]:size-6")
  }
};
