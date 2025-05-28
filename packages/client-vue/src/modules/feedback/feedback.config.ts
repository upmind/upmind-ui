import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  feedback: {
    root: cva("w-full bg-transparent"),
    banners: cva("flex flex-col"),
    toasts: cva(
      "fixed z-[999] flex max-h-screen w-full flex-col items-start justify-start overflow-auto [&>.alert]:shadow-md",
      {
        variants: {
          position: {
            "top-start":
              "bottom-auto end-auto start-0 top-0 translate-x-0 translate-y-0 items-start",
            "top-center":
              "bottom-auto end-1/2 start-1/2 top-0 -translate-x-1/2 translate-y-0 items-center rtl:translate-x-1/2",
            "top-end":
              "bottom-auto end-0 start-auto top-0 translate-x-0 translate-y-0 items-end",
            center:
              "end-1/2 start-1/2 -translate-x-1/2 items-center rtl:translate-x-1/2",
            "bottom-start":
              "bottom-0 end-auto start-0 translate-x-0 translate-y-0 items-start",
            "bottom-center":
              "bottom-0 end-1/2 start-1/2 -translate-x-1/2 translate-y-0 items-center rtl:translate-x-1/2",
            "bottom-end":
              "bottom-0 end-0 start-auto translate-x-0 translate-y-0 items-end",
          },
        },
        defaultVariants: {
          position: "bottom-center",
        },
      }
    ),
  },
};
