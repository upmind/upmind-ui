import { cva } from "class-variance-authority";

export const variants = {
  position: {
    static: "",
    absolute: "absolute top-0"
  }
};

const rootVariants = cva("", {
  variants: {
    position: variants.position
  },
  defaultVariants: {
    position: "static"
  }
});

export default {
  header: {
    root: rootVariants,
    container: cva("flex-row lg:flex-row"),
    left: {
      column: cva("py-0 lg:py-0", {
        variants: {
          background: {
            LTR: "flex-1 pr-0",
            RTL: "flex-none"
          }
        }
      }),
      content: cva("h-24 w-full py-0 lg:py-0", {
        variants: {
          background: {
            LTR: "",
            RTL: "max-w-app-aside lg:min-w-app-aside"
          }
        }
      })
    },
    right: {
      column: cva("py-0 lg:py-0", {
        variants: {
          background: {
            LTR: "flex-none",
            RTL: "flex-1 pl-0"
          }
        }
      }),
      content: cva("flex h-24 w-full gap-2 py-0 lg:py-0", {
        variants: {
          background: {
            LTR: "max-w-app-aside lg:min-w-app-aside",
            RTL: ""
          }
        }
      })
    }
  }
};
