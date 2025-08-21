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
        icon: cva("text-foreground h-5 w-5 transition-opacity duration-300")
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
    filters: {
      root: cva("inline-flex w-full items-center md:w-auto"),
      trigger: cva("-ml-1")
    },
    skeleton: {
      root: cva("text-foreground group relative flex min-h-80 flex-col"),
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
      controls: cva("flex items-center justify-between"),
      searchInput: cva("max-w-xl"),
      searchIcon: cva("text-control-foreground mr-1.5"),
      grid: {
        root: cva("flex w-full flex-col justify-end gap-12"),
        container: cva("grid grid-cols-1 gap-12 md:grid-cols-3")
      },
      emptyState: {
        root: cva(
          "flex w-full flex-col items-center justify-center space-y-4 p-4 py-10 text-center"
        ),
        icon: cva("text-emphasis-disabled"),
        title: cva("font-medium"),
        description: cva("text-emphasis-medium")
      }
    }
  },
  categories: {
    root: cva("flex flex-col gap-y-9"),
    grid: cva(
      "bg-base-background text-emphasis-medium grid w-full grid-cols-1 gap-px overflow-hidden rounded-lg border md:grid-cols-3"
    ),
    controls: {
      root: cva(
        "flex w-full flex-col items-start justify-between gap-4 md:flex-row md:items-center md:gap-0"
      )
    },
    header: {
      root: cva("flex max-w-2xl flex-col gap-y-3"),
      title: cva("m-0 text-5xl font-normal"),
      description: cva("text-md text-emphasis-medium m-0")
    },
    item: {
      root: cva(
        "text-foreground bg-card hover:bg-card/80 group relative z-10 m-0 flex h-full w-full flex-col items-start justify-start gap-4 rounded-none border-none p-8 text-left before:absolute before:-inset-px before:-z-10 before:border before:border-solid before:border-gray-100 before:content-['']"
      ),
      icon: cva(
        "text-emphasis-medium text-icon-secondary transition-all duration-300 [&>svg]:p-px"
      ),
      action: cva(
        "flex h-auto w-full flex-col gap-1 border-none px-0 py-0 text-left"
      ),
      titleContainer: cva(
        "m-0 flex w-full items-center justify-between text-lg font-normal"
      ),
      title: cva(""),
      arrowIcon: cva(
        "text-emphasis-medium group-hover:text-emphasis-none transition-all duration-300"
      ),
      description: cva(
        "text-emphasis-medium group-hover:text-emphasis-none m-0 line-clamp-3 text-sm whitespace-normal transition-all duration-300"
      )
    }
  }
};
