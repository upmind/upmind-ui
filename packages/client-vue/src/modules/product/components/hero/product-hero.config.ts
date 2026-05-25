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
    details: cva("w-full md:flex-1 md:pr-6", {
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
    aside: cva("text-right", {
      variants: {
        direction: {
          horizontal: "md:h-[var(--details-h)] md:max-h-64 md:max-w-1/2",
          vertical: ""
        }
      },
      defaultVariants: {
        direction: "horizontal"
      }
    }),
    image: {
      root: cva("inline-block h-full max-w-full"),
      product: cva("h-full"),
      grid: cva("ml-auto", {
        variants: {
          direction: {
            horizontal: "lg:max-w-64",
            vertical: ""
          }
        },
        defaultVariants: {
          direction: "vertical"
        }
      })
    },
    heroTitle: cva("", {
      variants: {
        direction: {
          horizontal: "",
          vertical: "md:text-4xl"
        }
      },
      defaultVariants: {
        direction: "horizontal"
      }
    }),
    heroDescription: cva("", {
      variants: {
        direction: {
          horizontal: "",
          vertical: "md:text-md-tight"
        }
      },
      defaultVariants: {
        direction: "horizontal"
      }
    })
  }
};
