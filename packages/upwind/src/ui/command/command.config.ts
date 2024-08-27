import { cva } from "class-variance-authority";

export const commandConfig = {
  root: cva(
    "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md"
  ),
  input: {
    root: cva(
      "placeholder:text-muted-foreground flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
    ),
    icon: cva("mr-1 h-3 w-3"),
    wrapper: cva("flex items-center border-b px-3"),
  },
  list: cva("max-h-[18rem] overflow-y-auto overflow-x-hidden"),
  empty: cva("py-6 text-center text-sm"),
  group: cva(
    "text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium"
  ),
  label: cva("text-muted-foreground px-2 py-1.5 text-xs font-medium"),
  item: cva(
    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
  ),
  separator: cva("bg-border -mx-1 h-px"),
  shortcut: cva("text-muted-foreground ml-auto text-xs tracking-widest"),
};

export default {
  command: commandConfig,
};
