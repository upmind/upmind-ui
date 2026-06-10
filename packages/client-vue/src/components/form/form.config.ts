import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  form: {
    sld: {
      description: cva(
        "text-muted bg-control-surface flex h-10 w-auto min-w-8 items-center justify-center border-l px-4 md:px-6"
      )
    },
    file: cva(
      "bg-control-surface control-radius border-control-default border"
    ),
    image: cva(
      "text-muted control-radius border-control-default mb-4 border transition-all duration-300"
    ),
    payment: {
      root: cva(
        "flex w-full flex-col flex-wrap justify-between gap-2 sm:flex-row sm:gap-4"
      ),
      header: {
        root: cva("flex items-center gap-2"),
        label: cva("text-display text-md-tight font-medium break-all")
      },
      footer: {
        root: cva(
          "flex flex-row-reverse items-center justify-end gap-2 sm:flex-row sm:justify-start"
        ),
        label: cva("text-faint text-sm"),
        icon: cva("h-5 w-8")
      }
    },
    radioCollapsible: {
      root: cva("flex items-center justify-start gap-1 px-3")
    }
  },
  modal: {
    scrollable: cva("gap-6 p-8 text-center md:p-18"),
    container: cva("gap-9"),
    header: cva("flex flex-col gap-2 text-center"),
    title: cva("text-3xl font-normal md:text-4xl"),
    description: cva("text-muted text-md font-normal"),
    footer: cva("flex-col gap-3 sm:flex-col")
  }
};
