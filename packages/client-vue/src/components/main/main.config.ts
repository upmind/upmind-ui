import { cva } from "class-variance-authority";

export default {
  main: cva("flex w-full flex-row", {
    variants: {
      mode: {
        grow: "grow",
        centered: "grow items-center justify-center"
      },
      overflow: {
        hidden: "overflow-hidden",
        visible: ""
      }
    },
    defaultVariants: {
      mode: "grow",
      overflow: "visible"
    }
  })
};
