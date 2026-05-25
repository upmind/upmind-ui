import { cva } from "class-variance-authority";

export default {
  products: {
    root: cva("flex flex-col gap-12 md:flex-row"),
    facets: {
      root: cva("mb-4 flex w-full flex-col md:mb-0 md:w-1/4")
    },
    facet: {
      root: cva("flex w-full flex-col gap-y-8"),
      search: {
        input: cva("max-w-xl"),
        icon: cva("text-control-foreground mr-1.5")
      },
      list: {
        root: cva("flex flex-col space-y-4"),
        icon: cva("h-5 w-5 text-base transition-opacity duration-200")
      },
      drillDown: {
        items: cva("flex flex-col space-y-2"),
        action: cva("flex justify-between"),
        back: cva("self-start")
      },
      expand: {
        button: cva("flex justify-between")
      }
    },
    skeleton: {
      root: cva("group relative flex flex-col text-base"),
      content: cva("flex h-full flex-col"),
      image: cva("h-64 w-full rounded"),
      details: cva("mt-4 flex flex-1 flex-col"),
      titleContainer: cva("space-y-2"),
      titleLine1: cva("h-6 w-4/5"),
      titleLine2: cva("h-6 w-3/5"),
      priceContainer: cva("mt-1 space-y-1"),
      price: cva("h-5 w-24"),
      cycle: cva("h-4 w-32"),
      descriptionContainer: cva("mt-3 flex-1 space-y-2"),
      descriptionLine1: cva("h-4 w-full"),
      descriptionLine2: cva("h-4 w-5/6"),
      descriptionLine3: cva("h-4 w-4/6"),
      buttonContainer: cva("mt-4 pt-2"),
      button: cva("h-12 w-full rounded")
    },
    main: {
      root: cva("flex w-full flex-col gap-12"),
      controls: cva(
        "flex flex-col items-center justify-between gap-3 md:flex-row"
      ),
      searchInput: cva("max-w-xl"),
      searchIcon: cva("text-control-foreground mr-1.5"),
      grid: {
        root: cva("flex w-full flex-col justify-end gap-12"),
        container: cva("grid grid-cols-1", {
          variants: {
            layout: {
              "1-col": "gap-12 md:grid-cols-1",
              "2-col": "gap-12 md:grid-cols-2",
              "3-col": "gap-12 md:grid-cols-3",
              "4-col": "gap-x-8 gap-y-12 md:grid-cols-4"
            }
          },
          defaultVariants: {
            layout: "3-col"
          }
        })
      },
      emptyState: {
        root: cva(
          "flex w-full flex-col items-center justify-center space-y-4 p-4 py-10 text-center"
        ),
        icon: cva("text-muted"),
        title: cva("font-medium"),
        description: cva("text-muted")
      }
    }
  },
  categories: {
    root: cva("flex flex-col gap-y-9"),
    grid: cva(
      "bg-surface text-muted border-surface control-radius grid w-full grid-cols-1 gap-px overflow-hidden border",
      {
        variants: {
          layout: {
            "1-col": "md:grid-cols-1",
            "2-col": "md:grid-cols-2",
            "3-col": "md:grid-cols-3",
            "4-col": "md:grid-cols-4",
            "5-col": "md:grid-cols-5",
            "6-col": "md:grid-cols-6"
          }
        },
        defaultVariants: {
          layout: "3-col"
        }
      }
    ),
    controls: {
      root: cva(
        "flex w-full flex-col items-start justify-between gap-4 md:flex-row md:items-center md:gap-0"
      )
    },
    item: {
      root: cva(
        "before:border-surface group relative z-10 m-0 flex h-full w-full flex-col items-start justify-start gap-4 rounded-none border-none bg-transparent! p-8 text-left text-base whitespace-normal shadow-none before:absolute before:-inset-px before:-z-10 before:border before:border-solid before:content-[''] [&:hover:not(:disabled),&:focus-within:not(:disabled),&[data-hover=true]:not([data-disabled=true]),&[data-focus=true]:not([data-disabled=true])]:shadow-none!"
      ),
      icon: cva(
        "text-muted text-icon-primary transition-all duration-200 [&>svg]:p-px"
      ),
      action: cva(
        "flex h-auto w-full flex-col gap-1 border-none px-0 py-0 text-left"
      ),
      titleContainer: cva(
        "m-0 flex w-full items-start justify-between gap-2 text-lg font-normal"
      ),
      title: cva(""),
      link: cva("font-medium"),
      badge: cva("mt-1 mr-auto"),
      arrowIcon: cva(
        "text-muted mt-1.5 transition-all duration-200 group-hover:text-base"
      ),
      description: cva(
        "text-muted m-0 line-clamp-3 text-sm font-normal whitespace-normal transition-all duration-200"
      )
    }
  }
};
