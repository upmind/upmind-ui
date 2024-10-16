import { cva } from "class-variance-authority";

export default {
  radioCards: {
    root: cva("gap-0"),
    item: cva(
      "flex cursor-pointer items-start space-x-2 border border-control shadow-sm"
    ),
    label: cva("m-0 h-full w-full rounded-md py-3 pr-6 text-xs "),
    input: cva("my-4 ml-3 mr-1 leading-normal"),
  },
};
