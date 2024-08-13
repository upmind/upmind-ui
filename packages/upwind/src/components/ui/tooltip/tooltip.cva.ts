import { cva } from "class-variance-authority";

export default {
  tooltip: {
    content: cva(
      "bg-base-800 z-50 overflow-hidden rounded px-3 py-1.5 text-sm text-white animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      {
        variants: {
          color: {
            base: "text-base-50 bg-base-800",
            primary: "bg-primary text-primary-foreground",
            secondary: "bg-secondary text-secondary-foreground",
            accent: "bg-accent text-accent-foreground",
            success: "text-success-foreground bg-success",
            error: "text-error-foreground bg-error",
            warning: "text-warning-foreground bg-warning",
            info: "text-info-foreground bg-info",
            promotion: "text-promotion-foreground bg-promotion",
          },
        },
      }
    ),
    arrow: cva("text-base-800", {
      variants: {
        color: {
          base: "text-base-800",
          primary: "text-primary",
          secondary: "text-secondary",
          accent: "text-accent",
          success: "text-success",
          error: "text-error",
          warning: "text-warning",
          info: "text-info",
          promotion: "text-promotion",
        },
      },
    }),
  },
};
