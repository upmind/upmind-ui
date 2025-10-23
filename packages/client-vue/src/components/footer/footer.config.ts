import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  footer: {
    root: cva("bg-surface shadow-t-border-surface w-full px-6 py-6 text-base"),
    container: cva(
      "max-w-app divide-border-surface mx-auto flex w-full flex-col divide-y [&>*]:py-6"
    ),
    actions: cva("flex justify-center gap-2 md:justify-end"),
    content: cva(
      "flex flex-col justify-between gap-2 text-center md:flex-row md:gap-0 md:text-left"
    )
  }
};
