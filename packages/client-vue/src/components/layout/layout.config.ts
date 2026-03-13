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
      "bg-surface flex min-h-screen w-full flex-col justify-between px-6 py-7 md:w-1/2 lg:px-16 lg:pt-24 lg:pb-9 2xl:px-32"
    ),
    content: {
      root: cva("flex grow flex-col gap-4"),
      container: cva("flex grow flex-col gap-12"),
      header: cva("lg:max-w-app-aside grow")
    },
    footer: cva("h-24 lg:h-16"),
    aside: cva("bg-canvas hidden min-h-screen md:block md:w-1/2")
  },

  canvasCard: {
    root: cva("w-full px-6"),
    container: cva("max-w-app lgp:y-24 mx-auto py-12"),
    header: cva("w-full"),
    card: cva(
      "bg-surface card-radius flex w-full flex-col justify-between gap-12 lg:flex-row lg:gap-32"
    ),
    contentHeader: cva("w-app-aside w-full"),
    content: cva("w-full")
  },

  surfaceBox: {
    root: cva(
      "bg-canvas flex min-h-screen w-full grow items-center justify-center"
    ),
    container: cva("flex w-full flex-col px-6 py-12 lg:px-8 lg:py-24"),
    header: cva("flex h-24 w-full items-end justify-between"),
    card: cva(
      "w-app-content max-w-app mx-auto flex w-full flex-col justify-between gap-9"
    ),
    contentHeader: cva("w-full"),
    content: cva("w-full")
  }
};
