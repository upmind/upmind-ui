import { cva } from "class-variance-authority";

export const variants = {
  direction: {
    horizontal: "flex-col md:flex-row md:justify-between",
    vertical: "flex-col-reverse"
  }
};

export default {
  header: {
    root: cva("flex w-full gap-6", {
      variants,
      defaultVariants: {
        direction: "horizontal"
      }
    }),
    details: cva("flex w-full flex-col gap-3 md:flex-1 md:pr-6", {
      variants: {
        hasImage: {
          true: "max-w-xl",
          false: "max-w-2xl"
        }
      },
      defaultVariants: {
        hasImage: false
      }
    }),
    title: cva("font-display text-4xl text-balance break-all", {
      variants: {
        direction: {
          horizontal: "md:text-5xl",
          vertical: ""
        }
      },
      defaultVariants: {
        direction: "horizontal"
      }
    }),
    description: cva("text-md text-muted font-normal"),
    price: cva("font-normal", {
      variants: {
        direction: {
          horizontal: "text-xl",
          vertical: "text-lg"
        }
      },
      defaultVariants: {
        direction: "horizontal"
      }
    }),
    aside: cva("", {
      variants: {
        direction: {
          horizontal:
            "md:h-[var(--details-h)] md:max-h-64 md:w-auto md:max-w-1/2",
          vertical: ""
        }
      },
      defaultVariants: {
        direction: "horizontal"
      }
    })
  }
};
