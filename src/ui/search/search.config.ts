import { cva } from "class-variance-authority";
import { ringClasses } from "../../assets/ring.styles";

export default {
  search: {
    input: cva(""),
    inputContainer: cva("text-md! cursor-default"),
    icon: cva("text-muted mr-1 size-5"),
    content: cva(
      `z-50 my-2 w-(--radix-popover-trigger-width) overflow-hidden rounded border p-2 ${ringClasses} bg-control-surface control-radius`
    ),
    divider: cva("mx-3 h-px border-t"),
    item: cva(
      "text-control-foreground text-md text-muted hover:text-control-selected cursor-pointer list-none rounded px-3 py-2 transition-all duration-200"
    )
  }
};
