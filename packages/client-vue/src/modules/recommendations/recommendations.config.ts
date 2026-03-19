import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  recommendation: {
    root: cva("relative h-full w-full p-0!"),
    container: cva("flex h-full flex-col"),

    image: {
      root: cva("m-0 aspect-video shrink-0 overflow-hidden rounded-t-lg"),
      placeholder: cva(
        "from-promotion to-promotion-200 block h-full w-full bg-linear-to-br"
      ),
      image: cva("m-0 h-full w-full rounded-t-lg object-cover object-center")
    },

    content: {
      root: cva("flex flex-1 flex-col justify-between space-y-8 p-6 pt-8", {
        variants: {
          hasImageAndBadge: {
            true: "pt-6" // Counteract additional padding needed for badge
          }
        }
      }),
      breakdown: cva(
        "flex flex-1 flex-col gap-y-6 text-sm leading-6 font-medium"
      ),

      details: {
        root: cva("flex flex-col gap-y-2"),
        title: cva("m-0 text-2xl font-medium"),
        description: cva("text-muted m-0 min-h-12 text-sm leading-6")
      },

      price: {
        root: cva("not-prose mt-auto flex flex-col gap-y-2"),
        intro: {
          root: cva("flex items-center space-x-2"),
          text: cva("text-muted text-sm")
        },
        current: {
          root: cva("flex items-baseline"),
          text: cva("text-3xl font-bold")
        },
        term: cva("text-muted ml-1 text-sm leading-none"),
        summary: cva("text-muted text-sm")
      },

      list: cva("m-0 mt-6 flex flex-col gap-2 p-0")
    },

    badge: cva("absolute left-4 -translate-y-1/2 text-sm! ring-1 ring-white"),

    benefit: {
      root: cva("flex items-start gap-2 text-base leading-tight"),
      icon: cva("text-secondary size-5 shrink-0"),
      label: cva("m-0")
    },

    carousel: {
      navigation: cva("flex justify-end space-x-2"),
      item: cva("pl-12 md:basis-1/2 xl:basis-1/3")
    },

    drawer: {
      footer: cva("flex-row items-center justify-between gap-x-4")
    },

    actions: {
      root: cva(
        "lg:bg-control-surface lg:border-surface card-radius mt-8 flex flex-col items-center justify-between bg-transparent p-0 lg:flex-row lg:border lg:px-8 lg:py-6"
      ),
      label: cva(
        "text-md order-last mt-4 text-center font-medium lg:order-first lg:mt-0 lg:text-left"
      ),
      button: cva("w-full lg:w-auto")
    },

    skeleton: {
      root: cva("h-full w-full p-0!"),
      container: cva("flex h-full flex-col"),
      image: {
        root: cva("aspect-video shrink-0 overflow-hidden"),
        skeleton: cva(
          "h-full w-full rounded-t-lg rounded-b-none! pt-2 text-base text-lg font-medium"
        )
      },
      content: {
        root: cva("flex flex-1 flex-col justify-between space-y-8 p-6"),
        inner: cva(
          "flex flex-1 flex-col justify-between gap-y-8 text-sm leading-6 font-medium"
        ),
        title: {
          root: cva("flex flex-col gap-x-2"),
          container: cva("flex flex-col gap-2"),
          skeleton: cva("m-0 text-2xl font-medium"),
          description: cva("text-muted m-0 min-h-12 text-sm leading-6")
        },
        price: {
          root: cva("not-prose flex flex-col gap-y-2"),
          intro: {
            root: cva("flex items-center space-x-2"),
            skeleton: cva("text-muted text-sm")
          },
          current: {
            root: cva("flex items-baseline"),
            skeleton: cva("text-3xl font-bold"),
            term: cva("text-muted ml-1 text-sm leading-none")
          },
          summary: cva("text-muted mt-1 text-sm")
        },
        button: {
          skeleton: cva("rounded-pill h-12 w-full")
        }
      }
    }
  }
};
