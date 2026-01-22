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
      root: cva("flex flex-1 flex-wrap content-start items-start gap-2"),
      content: cva("flex grow flex-col gap-0.5 md:flex-row md:gap-x-2"),
      titleWrapper: cva("flex flex-wrap items-center gap-2"),
      titleInner: cva("flex items-start gap-2"),
      title: cva("m-0 font-medium", { variants }),
      tooltip: cva("control-radius max-w-72 text-center text-xs"),
      trigger: cva("ml-1 inline-flex h-lh items-center align-top"),
      icon: cva(
        "text-muted hover:text-control-selected cursor-help transition-all duration-200"
      ),
      actions: cva("flex items-center gap-2")
    },
    pricing: {
      sm: cva("items-center gap-x-1 max-md:flex md:hidden", { variants }),
      lg: cva("hidden flex-col gap-2 text-right md:flex md:flex-row", {
        variants
      })
    },
    excerpt: cva("text-muted text-sm-tight whitespace-normal"),
    image: {
      root: cva("flex h-6 w-6 shrink-0 items-center justify-start"),
      img: cva("inline-block h-5 w-5 object-cover object-center")
    }
  }
};
