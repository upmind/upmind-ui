import { cva } from "class-variance-authority";

export default {
  root: cva("flex w-full grow flex-col", {
    variants: {
      overflow: {
        hidden: "overflow-hidden",
        visible: "overflow-visible"
      }
    }
  })
};
