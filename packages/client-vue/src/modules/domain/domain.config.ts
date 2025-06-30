import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  domain: {
    root: cva("flex w-full flex-col gap-6"),
    // ---

    listings: {
      root: cva("list-none"),
      loading: cva(
        "flex min-h-[68vh] flex-col items-center justify-center space-y-8 pb-24"
      )
    },

    search: {
      root: cva("px-3 py-2"),
      icon: cva(
        "text-emphasis-disabled hidden items-center justify-center pl-1 pr-4 md:flex"
      ),
      actions: cva("-mr-1 flex items-center justify-center space-x-4"),
      action: cva("h-10 rounded-lg px-3 md:h-12 md:px-4")
    },

    card: {
      root: cva(
        "flex w-full flex-col justify-between gap-y-4 py-1 md:flex-row md:items-center md:gap-x-4 md:gap-y-0"
      ),
      header: cva("flex items-center md:gap-x-4"),
      footer: {
        root: cva(
          "flex items-center justify-between gap-4 md:justify-normal md:gap-0"
        ),
        action: "",
        label: cva("sr-only"),
        icon: cva("")
      },
      icon: cva("mb-1 hidden md:block", {
        variants: {
          isAvailable: {
            true: "text-secondary",
            false: "text-emphasis-disabled"
          }
        }
      }),
      content: cva("flex w-full flex-col gap-y-1"),
      container: cva("m-0 flex w-full flex-wrap items-center gap-y-2"),
      label: cva("text-2xs m-0 uppercase", {
        variants: {
          isAvailable: {
            true: "text-secondary",
            false: "text-emphasis-disabled"
          }
        }
      }),
      title: cva("text-2xl", {
        variants: {
          isAvailable: {
            false: "text-emphasis-medium"
          }
        }
      }),
      sld: cva(
        "overflow-wrap-anywhere m-0 max-w-full break-all text-2xl font-normal"
      ),
      tld: cva("text-emphasis-none mr-2 text-2xl font-semibold"),
      promotion: cva(""),

      prices: {
        root: cva("flex flex-shrink-0 flex-col space-y-1 pr-6 md:space-y-0"),
        regular: cva("text-emphasis-disabled mr-2 text-xs"),
        current: cva("text-2xl font-semibold"),
        cycle: cva("text-emphasis-disabled text-xs font-normal")
      }
    },
    empty: {
      root: cva(
        "bg-base-muted flex flex-col items-center justify-center gap-4 rounded-lg p-4"
      ),
      title: cva("m-0 text-inherit"),
      text: cva("text-emphasis-medium m-0 text-center"),
      icon: cva("text-emphasis-medium size-8")
    },
    drawer: {
      root: cva(""),
      header: cva(""),
      content: cva(""),
      footer: cva("flex-row items-center justify-between gap-x-4")
    },

    form: {
      root: cva("flex flex-col gap-y-2"),
      trigger: {
        root: cva(
          "outline-control-active py-3 pr-5 outline-offset-4 hover:no-underline"
        ),
        label: cva("flex cursor-pointer items-center"),
        radio: cva("relative flex w-11 justify-center pl-1.5")
      },
      item: cva(
        "hover:border-control-strong rounded-lg border transition-all duration-200"
      ),
      items: cva("h-12"),
      card: cva("bg-base shadow-sm"),
      loading: cva("text-secondary"),
      content: {
        root: cva("p-4 pt-0 md:pl-11"),
        container: cva(
          "data-[state=open]:animate-accordion-transform-down data-[state=closed]:animate-accordion-transform-up overflow-visible transition-all duration-200"
        )
      },
      basket: {
        item: cva("text-base-foreground")
      }
    },

    transitions: {
      fade: {
        enter: {
          active: cva("duration-300 ease-out"),
          from: cva("transform opacity-0"),
          to: cva("opacity-100")
        },
        leave: {
          active: cva("hidden duration-200 ease-in"),
          from: cva("opacity-100"),
          to: cva("transform opacity-0")
        }
      }
    }
  }
};
