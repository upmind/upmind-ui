import { cva } from "class-variance-authority";
import { ringClasses } from "../../assets/ring.styles";

export default {
  search: {
    input: cva(""),
    inputContainer: cva("text-md! cursor-default"),
    icon: cva("text-emphasis-medium mr-1 size-5"),
    content: cva(
      `w-(--radix-popover-trigger-width) z-50 mt-2 overflow-hidden rounded border bg-white p-2 ${ringClasses}`
    ),
    divider: cva("mx-3 h-px border-t"),
    item: cva(
      "hover:bg-control-active-hover focus:bg-control-active-hover text-control-foreground cursor-pointer rounded px-3 py-2 text-sm"
    )
  }
};
