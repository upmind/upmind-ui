import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

const rootVariants = cva("w-full", {
  variants: {
    variant: {
      default:
        "bg-surface shadow-b-border-surface top-0 z-20 flex w-full flex-col items-center px-6 py-7 transition-all duration-500 md:px-2.5",
      enclosed:
        "bg-surface shadow-b-border-surface top-0 z-20 flex w-full flex-col items-center px-6 py-7 transition-all duration-500 md:px-2.5",
      full: "bg-surface shadow-b-border-surface top-0 z-20 flex w-full flex-col items-center px-6 py-7 transition-all duration-500 md:px-2.5",
      twoColumnLTR: "absolute top-0",
      twoColumnRTL: "absolute top-0",
      split: "hidden",
      canvasCard: "",
      surfaceBox: ""
    }
  }
});

const containerVariants = cva("flex w-full", {
  variants: {
    variant: {
      default: "max-w-app mx-auto flex w-full items-center justify-between",
      enclosed: "max-w-app mx-auto flex w-full items-center justify-between",
      full: "max-w-app mx-auto flex w-full items-center justify-between",
      twoColumnLTR: "justify-center",
      twoColumnRTL: "justify-center",
      split: "justify-center",
      canvasCard: "",
      surfaceBox: ""
    }
  }
});

const leftVariants = cva("", {
  variants: {
    variant: {
      default: "",
      enclosed: "",
      full: "bg-surface shadow-b-border-surface top-0 z-20 flex w-full flex-col items-center px-6 py-7 transition-all duration-500 md:px-2.5",
      twoColumnLTR:
        "basis-app-content bg-surface lg:w-app-content box-content flex h-24 w-full min-w-0 items-end px-8 pb-1 lg:px-18",
      twoColumnRTL:
        "basis-app-aside lg:w-app-aside box-content flex h-24 w-full min-w-0 items-end px-8 pb-1 lg:bg-transparent lg:px-18",
      split: "",
      canvasCard: "",
      surfaceBox: ""
    }
  }
});

const rightVariants = cva("", {
  variants: {
    variant: {
      default: "",
      enclosed: "",
      full: "max-w-app mx-auto flex w-full items-center justify-between",
      twoColumnLTR:
        "basis-app-aside bg-surface lg:w-app-aside box-content flex h-24 w-full min-w-0 items-end justify-end px-8 pb-1 lg:bg-transparent lg:px-18",
      twoColumnRTL:
        "basis-app-content lg:w-app-content box-content flex h-24 w-full min-w-0 items-end justify-end px-8 pb-1 lg:px-18",
      split: "",
      canvasCard: "",
      surfaceBox: ""
    }
  }
});

export default {
  header: {
    root: rootVariants,
    container: containerVariants,
    left: leftVariants,
    right: rightVariants
  }
};
