import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const variants = {
  variant: {
    solid: ""
  },
  color: {
    danger: "bg-accent-danger text-accent-danger-contrast"
  }
};

export const rootVariants = cva("text-md w-full font-medium", {
  variants,
  defaultVariants: {
    variant: "solid",
    color: "danger"
  }
});

const containerVariants = cva(
  "mx-auto flex w-full items-center justify-between px-5 py-4"
);

const spacerVariants = cva("size-lh shrink-0");

const contentVariants = cva("flex-1 text-center");

const actionVariants = cva(
  "size-lh flex shrink-0 cursor-pointer items-center justify-center"
);
// -----------------------------------------------------------------------------
export default {
  banner: {
    root: rootVariants,
    container: containerVariants,
    spacer: spacerVariants,
    content: contentVariants,
    action: actionVariants
  }
};
