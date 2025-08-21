import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  header: {
    root: cva(
      "bg-base-background text-base-foreground shadow-border-b top-0 z-20 flex w-full flex-col items-center px-2.5 py-7 transition-all duration-500"
    ),
    container: cva("mx-auto flex w-full items-center justify-between", {
      variants: {
        layout: {
          full: "max-w-app",
          enclosed: "max-w-app-lg"
        }
      }
    }),
    anchor: cva(
      "focus-visible:ring-primary relative z-20 rounded-lg outline-none focus-visible:ring-2"
    ),
    name: cva("text-2xl"),
    avatar: {
      login: cva("bg-primary-background text-foreground"),
      session: cva("bg-primary-background text-primary-foreground")
    }
  }
};
