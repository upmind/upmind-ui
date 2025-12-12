import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

const variants = {
  isMinimal: {
    true: "text-md-tight",
    false: "text-md"
  }
};

export default {
  card: {
    root: cva("m-0 flex w-full flex-col gap-1"),
    header: {
      root: cva("flex flex-1 items-start gap-2"),
      content: cva("flex grow flex-col gap-0.5 md:flex-row md:gap-x-2"),
      titleWrapper: cva("flex flex-wrap items-center gap-2"),
      title: cva("m-0 font-medium", { variants }),
      actions: cva("flex items-center gap-2")
    },
    pricing: {
      sm: cva("items-center gap-x-1 max-md:flex md:hidden", { variants }),
      lg: cva("hidden flex-col gap-2 text-right md:flex md:flex-row", {
        variants
      })
    },
    excerpt: cva("text-muted text-sm-tight whitespace-normal")
  }
};
