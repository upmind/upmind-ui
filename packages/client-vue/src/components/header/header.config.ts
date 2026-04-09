import { cva } from "class-variance-authority";

export const variants = {
  position: {
    static: "",
    absolute: "absolute top-0"
  }
};

const rootVariants = cva("z-10", {
  variants: {
    position: variants.position,
    visible: {
      true: "opacity-100 transition-opacity duration-300 ease-in-out",
      false: "opacity-0"
    }
  },
  defaultVariants: {
    position: "static",
    visible: true
  }
});

export default {
  header: {
    root: rootVariants,
    link: cva("flex no-underline"),
    picture: cva("h-full w-full"),
    image: cva("h-9 max-w-32 object-contain md:max-w-64"),
    name: cva("text-2xl font-medium"),
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
      content: cva("h-18 w-full py-0 lg:h-24 lg:py-0", {
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
      content: cva("flex h-18 w-full gap-2 py-0 lg:h-24 lg:py-0", {
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
