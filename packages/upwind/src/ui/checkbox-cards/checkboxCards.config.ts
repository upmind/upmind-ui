import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../input/input.config";

export default {
  checkboxCards: {
    root: cva(
      `${ringClasses} ${invalidRingClasses} w-full gap-0 border border-b-0 border-control`
    ),
    item: cva(
      "flex !cursor-pointer items-start space-x-2 border-b border-control shadow-sm hover:bg-base-100"
    ),
    label: cva("m-0 h-full w-full rounded-md py-3 pr-6 text-xs "),
    input: cva("my-3 ml-3 mr-1 leading-normal"),
  },
};
