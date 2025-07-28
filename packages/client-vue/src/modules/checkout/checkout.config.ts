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
    paymentDetails: cva("!p-0"),

    accordion: {
      root: cva("flex flex-col gap-4"),
      trigger: {
        root: cva(
          "text-emphasis-medium hover:text-foreground flex items-center justify-between space-x-2 p-4 px-6 transition-all duration-300 hover:no-underline md:p-5 md:px-9"
        ),
        icon: cva("h-6 w-6 shrink-0 transition-transform duration-200"),
        header: cva("flex w-full items-center justify-between space-x-2")
      },
      item: cva("border-none"),
      card: cva("bg-base shadow-sm"),
      loading: cva("text-secondary"),
      content: cva(
        "border-base-muted flex flex-col border-t p-5 px-6 transition-all duration-300 md:p-8 md:px-9"
      )
    },

    title: cva("text-foreground text-left text-sm leading-tight no-underline"),
    image: cva("m-0 h-6 md:h-7"),
    gateway: cva("w-full"),
    footer: cva(
      "flex flex-col items-stretch justify-start space-x-0 space-y-2 md:flex-row md:space-x-4 md:space-y-0"
    ),
    action: cva("block w-full self-center md:inline-block md:w-auto"),
    additional: cva(
      "bg-base-background text-base-foreground flex items-center justify-center space-x-2 self-stretch px-4 py-2 md:py-0"
    ),
    terms: cva("text-emphasis-medium mt-4 text-left text-sm leading-snug"),

    isFree: cva("bg-base shadow-sm")
  },

  client: {
    title: cva("flex justify-between")
  }
};
