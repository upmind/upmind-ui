import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  checkout: {
    root: cva(""),
    backButton: cva("relative -top-4 mt-6 md:mt-0"),
    section: cva(
      "relative mx-auto flex w-full flex-wrap items-start justify-start gap-6"
    ),
    container: cva(
      "relative flex w-full flex-wrap items-start justify-start gap-8"
    ),
    mainContent: cva("flex w-full flex-1 flex-col gap-8"),
    aside: cva(
      "order-last flex w-full flex-col items-start gap-6 sm:sticky sm:top-1 xl:max-w-md"
    ),
    asideInner: cva("flex w-full flex-col gap-6 text-left"),
    session: cva("w-full min-w-full"),
    paymentDetails: cva("p-0!"),

    accordion: {
      root: cva("flex flex-col gap-3"),
      trigger: {
        root: cva(
          "text-emphasis-high hover:text-foreground bg-control-background shadow-border flex cursor-pointer items-center justify-between space-x-2 rounded px-4 py-2 transition-all duration-300 hover:no-underline"
        ),
        icon: cva(
          "text-emphasis-high group-hover:text-emphasis-none ml-auto transition-all duration-200 [&>svg]:size-3 [&>svg]:transition-all [&>svg]:duration-300"
        ),
        header: cva("flex w-full items-center justify-between space-x-2")
      },
      item: cva("border-none"),
      card: cva("bg-base"),
      loading: cva("text-secondary"),
      content: cva("flex flex-col gap-6 transition-all duration-300", {
        variants: {
          layout: {
            full: "p-4",
            enclosed: "py-3",
            default: "p-3"
          }
        }
      })
    },

    title: cva("text-md text-left font-normal no-underline"),
    image: cva("m-0 h-6 md:h-7"),
    gateway: cva("w-full"),
    footer: {
      root: cva("flex w-full flex-col gap-4"),
      actions: cva(
        "flex flex-col items-stretch justify-start space-y-2 space-x-0 md:flex-row md:space-y-0 md:space-x-4"
      ),
      terms: cva("text-emphasis-medium text-sm")
    },
    action: cva("block w-full self-center md:inline-block md:w-auto"),
    additional: cva(
      "bg-base-background text-base-foreground flex items-center justify-center gap-2 space-x-2 self-stretch px-4 py-2 md:py-0"
    ),
    clickwrap: cva(
      "text-emphasis-medium prose prose-a:font-normal prose-a:text-inherit text-left text-sm leading-snug"
    ),

    isFree: cva("bg-base")
  },

  client: {
    title: cva("flex justify-between")
  }
};
