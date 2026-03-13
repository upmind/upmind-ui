import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  payment: {
    root: cva("flex min-h-24 flex-col gap-5"),
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

    accordion: {
      root: cva("mt-6 flex flex-col gap-1"),
      trigger: {
        root: cva(
          "bg-control-surface shadow-control-default hover:shadow-control-hover data-[state=open]:bg-background data-[state=open]:shadow-foreground flex cursor-pointer items-center justify-between space-x-2 rounded px-5 py-3 text-base font-medium transition-all duration-200 hover:text-base hover:no-underline"
        ),
        icon: cva(
          "text-muted ml-auto transition-all duration-200 group-hover:text-base [&>svg]:size-3 [&>svg]:transition-all [&>svg]:duration-200"
        ),
        header: cva("flex w-full items-center justify-between space-x-2")
      },
      item: cva("border-none"),
      card: cva("bg-base"),
      loading: cva("text-secondary"),
      content: cva(
        "flex flex-col gap-6 px-1 py-4 transition-all duration-200 empty:p-0",
        {
          variants: {
            layout: {
              full: "px-1 py-4",
              enclosed: "px-1 py-3",
              default: "px-1 py-3"
            }
          }
        }
      )
    },

    title: cva("text-md text-left no-underline"),
    image: cva("m-0 h-6 md:h-7"),

    gateway: {
      root: cva("flex flex-col gap-5"),
      form: cva("flex w-full flex-col justify-center gap-6", {
        variants: {
          hasErrors: {
            true: "border-control-error focus-within:ring-control-error focus-within:ring-opacity-20 focus-within:ring-4",
            false: ""
          }
        },
        defaultVariants: { hasErrors: false }
      })
    },

    stored: {
      root: cva("flex flex-col gap-6")
    },

    footer: {
      root: cva("flex w-full flex-col gap-6"),
      actions: cva(
        "flex flex-col items-stretch justify-start space-y-2 space-x-0 md:flex-row md:space-y-0 md:space-x-4"
      ),
      terms: cva("text-muted text-sm")
    },
    action: cva("flex w-full self-center md:inline-flex md:w-auto"),
    clickwrap: cva(
      "text-muted prose prose-a:font-normal prose-a:text-inherit max-w-full text-left text-sm leading-snug"
    ),

    isFree: cva("w-full")
  }
};
