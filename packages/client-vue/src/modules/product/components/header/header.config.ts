import { cva } from "class-variance-authority";

export default {
  header: {
    root: cva("flex flex-col gap-6 md:flex-row md:justify-between"),
    details: cva("flex w-full max-w-xl flex-col gap-3 md:flex-1 md:pr-6"),
    title: cva("text-5xl"),
    description: cva("text-md text-emphasis-medium font-normal"),
    price: cva("text-xl font-normal"),
    aside: cva("md:max-h-54 md:w-auto md:max-w-1/2")
  }
};
