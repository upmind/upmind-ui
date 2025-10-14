import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  header: {
    root: cva(
      "bg-surface shadow-b-border-surface top-0 z-20 flex w-full flex-col items-center px-6 py-7 transition-all duration-500 md:px-2.5"
    ),
    container: cva("mx-auto flex w-full items-center justify-between", {
      variants: {
        layout: {
          default: "max-w-app",
          full: "max-w-app",
          enclosed: "max-w-app-lg"
        }
      },
      defaultVariants: {
        layout: "default"
      }
    }),
    anchor: cva(
      "focus-visible:ring-primary relative z-20 rounded-lg outline-none focus-visible:ring-2"
    ),
    name: cva("text-2xl"),
    avatar: {
      basket: cva("")
    }
  }
};
