import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  feedback: {
    root: cva("w-full bg-transparent"),
    banners: cva("flex flex-col"),
    toasts: cva(
      "fixed z-999 flex max-h-screen w-full flex-col items-start justify-start overflow-auto",
      {
        variants: {
          position: {
            "top-start":
              "start-0 end-auto top-0 bottom-auto translate-x-0 translate-y-0 items-start",
            "top-center":
              "start-1/2 end-1/2 top-0 bottom-auto -translate-x-1/2 translate-y-0 items-center rtl:translate-x-1/2",
            "top-end":
              "start-auto end-0 top-0 bottom-auto translate-x-0 translate-y-0 items-end",
            center:
              "start-1/2 end-1/2 -translate-x-1/2 items-center rtl:translate-x-1/2",
            "bottom-start":
              "start-0 end-auto bottom-0 translate-x-0 translate-y-0 items-start",
            "bottom-center":
              "start-1/2 end-1/2 bottom-0 -translate-x-1/2 translate-y-0 items-center rtl:translate-x-1/2",
            "bottom-end":
              "start-auto end-0 bottom-0 translate-x-0 translate-y-0 items-end"
          }
        },
        defaultVariants: {
          position: "bottom-center"
        }
      }
    )
  }
};
