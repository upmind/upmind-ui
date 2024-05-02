import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  feedback: {
    root: cva("w-full bg-transparent"),
    banners: cva("flex flex-col"),
    toasts: cva(
      "flex flex-col items-start gap-2 max-h-screen  fixed z-[999] [&>.alert]:shadow-md ",
      {
        variants: {
          position: {
            "top-start":
              "bottom-auto end-auto start-0 top-0 translate-x-0 translate-y-0",
            "top-end":
              "bottom-auto start-auto end-0 top-0 translate-x-0 translate-y-0",
            center: "end-1/2 start-1/2 -translate-x-1/2 rtl:translate-x-1/2",
            "bottom-start":
              "bottom-0 end-auto start-0 translate-x-0 translate-y-0",
            "bottom-end":
              "bottom-0 start-auto end-0 translate-x-0 translate-y-0",
          },
        },
        defaultVariants: {
          position: "top-end",
        },
      }
    ),
  },

  bannerTransitionEnter: {
    active: cva("m-0 transition duration-300 ease-out"),
    from: cva("-translate-y-10 transform opacity-0"),
    to: cva("translate-y-0 transform opacity-100"),
  },

  bannerTransitionLeave: {
    active: cva("transition duration-100 ease-in absolute"),
    from: cva("translate-y-0 transform opacity-100"),
    to: cva("-translate-y-1 transform opacity-0"),
  },

  toastTransitionEnter: {
    active: cva("m-0 transition duration-300 ease-out"),
    from: cva("translate-x-10 transform opacity-0"),
    to: cva("translate-x-0 transform opacity-100"),
  },
  toastTransitionLeave: {
    active: cva("transition duration-100 ease-in"),
    from: cva("translate-x-0 transform opacity-100"),
    to: cva("translate-x-10 transform opacity-0"),
  },
};
