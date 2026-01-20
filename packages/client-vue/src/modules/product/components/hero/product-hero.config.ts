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
    title: {
      root: cva("flex gap-x-5 gap-y-2", {
        variants: {
          direction: {
            horizontal:
              "flex-col-reverse items-start xl:flex-row xl:items-center",
            vertical: "flex-col-reverse items-start"
          }
        },
        defaultVariants: {
          direction: "horizontal"
        }
      }),
      text: cva("font-display break-word text-4xl text-balance", {
        variants: {
          direction: {
            horizontal: "md:text-5xl",
            vertical: ""
          }
        },
        defaultVariants: {
          direction: "horizontal"
        }
      })
    },
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
    aside: cva("text-right", {
      variants: {
        direction: {
          horizontal:
            "md:h-[var(--details-h)] md:max-h-64 md:w-1/2 md:max-w-1/2",
          vertical: ""
        }
      },
      defaultVariants: {
        direction: "horizontal"
      }
    }),
    image: cva("inline-block h-full max-w-full")
  }
};
