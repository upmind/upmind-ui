import { cva } from "class-variance-authority";

export const contentVariants = cva(
  `bg-control-surface text-display data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 shadow-control-default control-radius z-50 min-w-48 border-none p-0`
);

export default {
  contextMenu: {
    content: contentVariants,
    label: cva("border-control-default border-b px-5 py-3 text-sm font-medium"),
    group: cva("p-2"),
    item: cva("[[data-highlighted]_&]:bg-button-ghost-hover font-normal")
  }
};
