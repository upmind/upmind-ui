import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------
export default {
  card: {
    root: cva("m-0 flex w-full flex-col gap-1 font-normal"),
    header: {
      root: cva("flex flex-1 flex-wrap content-start items-start gap-2"),
      content: cva("flex grow flex-col gap-0.5 md:flex-row md:gap-x-2"),
      titleWrapper: cva("flex flex-wrap items-center gap-2"),
      titleInner: cva("flex items-start gap-2"),
      title: cva("m-0", {
        variants: {
          isMinimal: {
            true: ""
          },
          isDropdown: {
            true: "text-base font-normal group-hover/item:text-base group-hover/item:font-medium group-data-[state=checked]/item:font-medium",
            false: "font-medium"
          }
        },
        compoundVariants: [
          {
            isMinimal: true,
            isDropdown: false,
            class: "text-md-tight"
          },
          {
            isMinimal: false,
            isDropdown: false,
            class: "text-md font-medium"
          }
        ]
      }),
      tooltip: cva("control-radius max-w-72 text-center text-xs"),
      trigger: cva("ml-1 inline-flex h-lh items-center align-top"),
      icon: cva(
        "text-muted hover:text-control-selected cursor-help transition-colors duration-300"
      ),
      actions: cva("flex items-center gap-2")
    },
    pricing: {
      sm: cva("items-center gap-x-1 max-md:flex md:hidden", {
        variants: {
          isDropdown: {
            true: "font-normal group-hover/item:font-medium group-data-[state=checked]/item:font-medium",
            false: "font-medium"
          }
        }
      }),
      lg: cva("hidden flex-col gap-2 text-right md:flex md:flex-row", {
        variants: {
          isDropdown: {
            true: "text-base font-normal group-hover/item:font-medium group-data-[state=checked]/item:font-medium",
            false: "font-medium"
          }
        }
      }),
      text: cva("", {
        variants: {
          isDropdown: {
            true: "text-sm-tight text-base font-normal transition-all duration-300 group-hover/item:font-medium group-data-[state=checked]/item:font-medium",
            false: "text-md font-medium"
          }
        }
      }),
      ex: cva("text-sm"),
      current: cva("flex items-center justify-center hover:cursor-help", {
        variants: {
          isDropdown: {
            true: "text-md font-medium",
            false: "text-md-tight"
          }
        }
      })
    },
    excerpt: cva("text-sm-tight whitespace-normal", {
      variants: {
        isDropdown: {
          false: "text-muted",
          true: "text-muted"
        }
      }
    }),
    image: {
      root: cva("size-lh flex shrink-0 items-center justify-start", {
        variants: {
          isMinimal: {
            true: ""
          },
          isDropdown: {
            true: "text-base",
            false: ""
          }
        },
        compoundVariants: [
          {
            isMinimal: true,
            isDropdown: false,
            class: "text-md-tight"
          },
          {
            isMinimal: false,
            isDropdown: false,
            class: "text-md"
          }
        ]
      }),
      img: cva(
        "inline-block h-5 min-h-5 w-5 min-w-5 object-contain object-center"
      )
    }
  }
};
