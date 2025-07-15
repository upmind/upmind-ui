import { cva } from "class-variance-authority";

export default {
  products: {
    root: cva("flex flex-col space-y-4 md:flex-row md:space-x-8 md:space-y-0"),
    facets: {
      root: cva("mb-4 flex w-full flex-col md:mb-0 md:w-1/4")
    },
    facet: {
      root: cva("flex w-full flex-col gap-y-4"),
      search: {
        input: cva("max-w-xl"),
        icon: cva("text-control-foreground mr-1.5")
      },
      list: {
        root: cva("flex flex-col space-y-2"),
        icon: cva("text-foreground h-5 w-5 transition-opacity duration-300")
      },
      drillDown: {
        button: cva("flex justify-between")
      },
      expand: {
        button: cva("flex justify-between")
      }
    },
    filters: {
      root: cva("inline-flex w-full items-center space-x-1 md:w-auto"),
      trigger: cva("-ml-1")
    },
    item: {
      root: cva("text-foreground group relative flex min-h-80 flex-col"),
      content: cva("flex h-full flex-col"),
      image: cva("h-64 w-full rounded-lg object-cover object-center"),
      imagePlaceholder: cva(
        "bg-secondary text-secondary-foreground flex h-64 w-full items-center justify-center rounded-lg"
      ),
      placeholderIcon: cva("text-emphasis-disabled"),
      details: cva("mt-4 flex flex-1 flex-col"),
      title: cva("line-clamp-2 text-lg"),
      termsDescription: cva("!text-emphasis-high mt-1 not-italic"),
      description: cva("text-emphasis-medium mt-3 line-clamp-3 flex-1 text-sm"),
      buttonContainer: cva("mt-4 pt-2"),
      buttonIcon: cva("")
    },
    skeleton: {
      root: cva("text-foreground group relative flex min-h-80 flex-col"),
      content: cva("flex h-full flex-col"),
      image: cva("h-64 w-full rounded-lg"),
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
      root: cva("flex w-full flex-col gap-y-6"),
      controls: cva("flex items-center justify-between"),
      searchInput: cva("max-w-xl"),
      searchIcon: cva("text-control-foreground mr-1.5"),
      grid: {
        root: cva("flex w-full flex-col justify-end gap-y-12"),
        container: cva("grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-3")
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
    root: cva("flex flex-col gap-y-10"),
    grid: cva(
      "bg-base-background text-emphasis-medium grid w-full grid-cols-1 gap-px overflow-hidden rounded-2xl border md:grid-cols-3"
    ),
    controls: {
      root: cva(
        "flex w-full flex-col items-start justify-between gap-4 md:flex-row md:items-center md:gap-0"
      )
    },
    header: {
      root: cva("flex max-w-2xl flex-col gap-y-2"),
      title: cva("m-0 text-4xl font-normal"),
      description: cva("text-md text-emphasis-medium m-0")
    },
    item: {
      root: cva(
        "text-foreground bg-card hover:bg-card/80 group relative z-10 m-0 flex h-full w-full flex-col items-start justify-start space-y-2 rounded-none border-none p-4 py-8 text-left before:absolute before:-inset-px before:-z-10 before:border before:border-solid before:border-gray-100 before:content-['']"
      ),
      icon: cva(
        "text-emphasis-medium text-icon-secondary mx-4 transition-all duration-300"
      ),
      action: cva("block h-auto w-full border-none px-4 py-3 text-left"),
      titleContainer: cva(
        "m-0 flex w-full items-center justify-between text-lg font-normal"
      ),
      title: cva(""),
      arrowIcon: cva(
        "text-emphasis-medium group-hover:text-emphasis-none transition-all duration-300"
      ),
      description: cva(
        "text-emphasis-medium group-hover:text-emphasis-none m-0 line-clamp-3 whitespace-normal text-sm transition-all duration-300"
      )
    }
  }
};
