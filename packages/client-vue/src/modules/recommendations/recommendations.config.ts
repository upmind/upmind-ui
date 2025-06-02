import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  recommendation: {
    root: cva("relative h-full w-full !p-0"),
    container: cva("flex h-full flex-col"),

    image: {
      root: cva("m-0 aspect-video shrink-0 overflow-hidden rounded-t-lg"),
      placeholder: cva(
        "from-promotion to-promotion-200 block h-full w-full bg-gradient-to-br"
      ),
      image: cva("m-0 h-full w-full rounded-t-lg object-cover object-center"),
    },

    content: {
      root: cva("flex flex-1 flex-col justify-between space-y-8 p-6 pt-8", {
        variants: {
          hasImageAndBadge: {
            true: "pt-6", // Counteract additional padding needed for badge
          },
        },
      }),
      breakdown: cva(
        "flex flex-1 flex-col gap-y-6 text-sm font-medium leading-6"
      ),

      details: {
        root: cva("flex flex-col gap-y-2"),
        title: cva("m-0 text-2xl font-semibold"),
        description: cva("text-emphasis-medium m-0 min-h-12 text-sm leading-6"),
      },

      price: {
        root: cva("not-prose mt-auto flex flex-col gap-y-2"),
        intro: {
          root: cva("flex items-center space-x-2"),
          text: cva("text-emphasis-medium text-sm"),
        },
        current: {
          root: cva("flex items-baseline"),
          text: cva("text-3xl font-bold"),
        },
        term: cva("text-emphasis-medium ml-1 text-sm leading-none"),
        summary: cva("text-emphasis-medium text-sm"),
      },

      list: cva("m-0 mt-6 flex flex-col gap-2 p-0"),
    },

    badge: cva("absolute left-4 -translate-y-1/2 !text-sm ring-1 ring-white"),

    benefit: {
      root: cva("text-base-foreground flex items-start gap-2 leading-tight"),
      icon: cva("text-secondary size-5 flex-shrink-0"),
      label: cva("m-0"),
    },

    carousel: {
      navigation: cva("flex justify-end space-x-2"),
      item: cva("md:basis-1/2 xl:basis-1/3"),
    },

    drawer: {
      footer: cva("flex-row items-center justify-between gap-x-4"),
    },

    skeleton: {
      root: cva("h-full w-full !p-0"),
      container: cva("flex h-full flex-col"),
      image: {
        root: cva("aspect-video shrink-0 overflow-hidden"),
        skeleton: cva(
          "text-primary h-full w-full !rounded-b-none rounded-t-lg pt-2 text-lg font-medium"
        ),
      },
      content: {
        root: cva("flex flex-1 flex-col justify-between space-y-8 p-6"),
        inner: cva(
          "flex flex-1 flex-col justify-between gap-y-8 text-sm font-medium leading-6"
        ),
        title: {
          root: cva("flex flex-col gap-x-2"),
          container: cva("flex flex-col gap-2"),
          skeleton: cva("m-0 text-2xl font-semibold"),
          description: cva(
            "text-emphasis-disabled m-0 min-h-12 text-sm leading-6"
          ),
        },
        price: {
          root: cva("not-prose flex flex-col gap-y-2"),
          intro: {
            root: cva("flex items-center space-x-2"),
            skeleton: cva("text-emphasis-disabled text-sm"),
          },
          current: {
            root: cva("flex items-baseline"),
            skeleton: cva("text-3xl font-bold"),
            term: cva("text-emphasis-medium ml-1 text-sm leading-none"),
          },
          summary: cva("text-emphasis-disabled mt-1 text-sm"),
        },
        button: {
          skeleton: cva("rounded-pill h-12 w-full"),
        },
      },
    },
  },
};
