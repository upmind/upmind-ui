import { cva } from "class-variance-authority";
import { ringClasses } from "../../assets/styles";

export default {
  search: {
    input: cva("!text-md"),
    icon: cva("text-emphasis-medium mr-1 size-5"),
    content: cva(
      `z-50 mt-2 w-[--radix-popover-trigger-width] overflow-hidden rounded-lg border bg-white p-2 ${ringClasses}`
    ),
    divider: cva("mx-3 h-[1px] border-t"),
    item: cva(
      "text-emphasis-medium hover:text-emphasis-medium hover:text-emphasis-none cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-control-active hover:text-white"
    ),
  },
};
