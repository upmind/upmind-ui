import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  image: {
    container: cva("relative"),
    root: cva("h-64 w-full rounded-lg object-cover object-center"),
    nav: {
      root: cva("absolute bottom-0 right-0 flex p-[22px]"),
      item: cva("text-white")
    }
  }
};
