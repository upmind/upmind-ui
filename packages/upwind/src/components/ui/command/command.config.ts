import { cva } from "class-variance-authority";

export const commandConfig = {
  root: cva(
    "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground"
  ),
  input: {
    root: cva(
      "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
    ),
    icon: cva("mr-1 h-3 w-3"),
    wrapper: cva("flex items-center border-b px-3"),
  },
  list: cva("max-h-[18rem] overflow-y-auto overflow-x-hidden"),
  empty: cva("py-6 text-center text-sm"),
  group: cva(
    "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
  ),
  label: cva("px-2 py-1.5 text-xs font-medium text-muted-foreground"),
  item: cva(
    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
  ),
  separator: cva("-mx-1 h-px bg-border"),
  shortcut: cva("ml-auto text-xs tracking-widest text-muted-foreground"),
};

export default {
  command: commandConfig,
};
