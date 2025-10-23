import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

const rootVariants = cva("", {
  variants: {
    variant: {
      default: "bg-surface shadow-t-border-surface w-full px-6 py-6 text-base",
      enclosed: "bg-surface shadow-t-border-surface w-full px-6 py-6 text-base",
      full: "bg-surface shadow-t-border-surface w-full px-6 py-6 text-base",
      twoColumnLTR: "absolute bottom-0 w-full",
      twoColumnRTL: "",
      split: "",
      canvasCard: "",
      surfaceBox: ""
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

const containerVariants = cva("", {
  variants: {
    variant: {
      default:
        "max-w-app divide-border-surface mx-auto flex w-full flex-col divide-y [&>*]:py-6",
      enclosed:
        "max-w-app divide-border-surface mx-auto flex w-full flex-col divide-y [&>*]:py-6",
      full: "max-w-app divide-border-surface mx-auto flex w-full flex-col divide-y [&>*]:py-6",
      twoColumnLTR:
        "flex flex-col items-center justify-center lg:w-full lg:flex-row lg:items-end",
      twoColumnRTL: "",
      split: "",
      canvasCard: "",
      surfaceBox: ""
    }
  }
});

const actionsVariants = cva("", {
  variants: {
    variant: {
      default: "flex justify-center gap-2 md:justify-end",
      enclosed: "flex justify-center gap-2 md:justify-end",
      full: "flex justify-center gap-2 md:justify-end",
      twoColumnLTR:
        "lg:basis-app-content bg-surface w-app-content box-content flex min-w-0 flex-col-reverse items-center justify-between gap-4 pb-2 lg:flex-row lg:items-end lg:gap-0 lg:px-18 lg:pt-18 lg:pb-9",
      twoColumnRTL: "",
      split: "",
      canvasCard: "",
      surfaceBox: ""
    }
  }
});

const contentVariants = cva("", {
  variants: {
    variant: {
      default:
        "flex flex-col justify-between gap-2 text-center md:flex-row md:gap-0 md:text-left",
      enclosed:
        "flex flex-col justify-between gap-2 text-center md:flex-row md:gap-0 md:text-left",
      full: "flex flex-col justify-between gap-2 text-center md:flex-row md:gap-0 md:text-left",
      twoColumnLTR:
        "lg:basis-app-aside lg:w-app-aside box-content min-w-0 pb-9 lg:px-18 lg:pt-18",
      twoColumnRTL: "",
      split: "",
      canvasCard: "",
      surfaceBox: ""
    }
  }
});

export default {
  footer: {
    root: rootVariants,
    container: containerVariants,
    actions: actionsVariants,
    content: contentVariants
  }
};
