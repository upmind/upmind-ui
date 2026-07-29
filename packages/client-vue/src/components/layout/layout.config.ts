import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  control: {
    root: cva(
      "shadow-b-border-surface bg-surface flex w-full shrink-0 items-center justify-center self-start px-6 py-4"
    ),
    container: cva("flex w-full items-center justify-between", {
      variants: {
        variant: {
          default: "max-w-app",
          full: "max-w-app",
          enclosed: "max-w-app"
        }
      }
    }),
    controls: cva("grow")
  },

  split: {
    root: cva("flex min-h-screen w-full flex-row"),
    container: cva(
      "bg-surface flex min-h-screen w-full flex-col justify-end gap-6 px-6 py-7 md:w-1/2 lg:px-16 lg:pt-24 lg:pb-9 2xl:px-32"
    ),
    content: cva(""),
    footer: cva("h-24 lg:h-16"),
    aside: cva("bg-canvas hidden min-h-screen md:block md:w-1/2")
  },

  canvasCard: {
    root: cva("flex w-full items-center justify-center px-6"),
    container: cva("max-w-app mx-auto py-12 lg:py-24"),
    header: cva("w-full"),
    card: cva(
      "bg-surface card-radius flex w-full flex-col justify-between gap-12 lg:flex-row lg:gap-32"
    ),
    contentHeader: cva("w-app-aside w-full"),
    content: cva("w-full")
  },

  surfaceBox: {
    root: cva("bg-canvas flex w-full grow items-center justify-center"),
    container: cva("flex w-full flex-col px-4 pt-6 pb-12 lg:px-8"),
    header: cva("flex w-full items-end justify-between"),
    card: cva("mx-auto flex w-full max-w-2xl flex-col justify-between"),
    contentHeader: cva("w-full"),
    content: cva("w-full")
  },

  inset: {
    // Compact back row: strip the Column's default vertical padding.
    backColumn: cva("py-0 lg:py-0"),
    backContent: cva("pt-10 pb-0 lg:pt-10 lg:pb-0"),
    // Centered: the card owns the full column, so horizontal padding drops at lg.
    content: cva("", {
      variants: {
        centered: { true: "lg:px-0" }
      }
    }),
    headerColumn: cva("py-0 lg:py-0"),
    contentColumn: cva("lg:pt-0", {
      variants: {
        centered: {
          true: "mx-auto w-full max-w-xl lg:px-0",
          false: "lg:pr-0"
        }
      }
    }),
    // Drop the aside's inner (left) padding so the summary sits close to content.
    aside: cva("lg:pt-0 lg:pl-0")
  }
};
