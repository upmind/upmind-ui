import { cva } from "class-variance-authority";
import { ringClasses } from "../../assets/ring.styles";

export default {
  search: {
    input: cva(""),
    inputContainer: cva("text-md! cursor-default"),
    icon: cva("text-emphasis-medium mr-1 size-5"),
    content: cva(
      `z-50 mt-2 w-(--radix-popover-trigger-width) overflow-hidden rounded border bg-white p-2 ${ringClasses}`
    ),
    divider: cva("mx-3 h-px border-t"),
    item: cva(
      "hover:bg-control-active-hover focus:bg-control-active-hover text-control-foreground text-md cursor-pointer list-none rounded px-3 py-2"
    )
  }
};
