import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
// animate-ping
export default {
  badge: {
    root: cva(
      "relative inline-flex items-center gap-x-1.5 rounded-full px-2 text-xs font-medium leading-normal transition-all",
      {
        variants: {
          variant: {
            flat: "border-transparent",
            outlined: "border bg-opacity-0",
            tonal: "border-transparent",
          },
          color: {
            base: "text-base-50 bg-base-800",
            primary: "bg-primary text-primary-content",
            secondary: "bg-secondary text-secondary-content",
            accent: "bg-accent text-accent-content",
            neutral: "bg-neutral text-neutral-content",
            success: "bg-success text-success-content",
            error: "bg-error text-error-content",
            warning: "bg-warning text-warning-content",
            info: "bg-info text-info-content",
          },
        },
        compoundVariants: [
          // ---base + variant ---
          {
            color: "base",
            variant: "outlined",
            class: "border-base-content text-base-content",
          },
          {
            color: "base",
            variant: "tonal",
            class: "bg-base-200 text-base-content",
          },

          // ---primary + variant ---
          {
            color: "primary",
            variant: "outlined",
            class: "border-primary text-primary",
          },
          {
            color: "primary",
            variant: "tonal",
            class: "bg-primary-50 text-primary",
          },

          // ---secondary + variant ---
          {
            color: "secondary",
            variant: "outlined",
            class: "border-secondary text-secondary",
          },
          {
            color: "secondary",
            variant: "tonal",
            class: "bg-secondary-50 text-secondary",
          },

          // ---accent + variant ---
          {
            color: "accent",
            variant: "outlined",
            class: "border-accent text-accent",
          },
          {
            color: "accent",
            variant: "tonal",
            class: "bg-accent-50 text-accent",
          },

          // ---neutral + variant ---
          {
            color: "neutral",
            variant: "outlined",
            class: "border-neutral text-neutral",
          },
          {
            color: "neutral",
            variant: "tonal",
            class: "text-neutral bg-neutral-50",
          },

          // ---success + variant ---
          {
            color: "success",
            variant: "outlined",
            class: "border-success text-success",
          },
          {
            color: "success",
            variant: "tonal",
            class: "bg-success-50 text-success",
          },

          // ---error + variant ---
          {
            color: "error",
            variant: "outlined",
            class: "border-error text-error",
          },
          {
            color: "error",
            variant: "tonal",
            class: "bg-error-50 text-error",
          },

          // ---warning + variant ---
          {
            color: "warning",
            variant: "outlined",
            class: "border-warning text-warning",
          },
          {
            color: "warning",
            variant: "tonal",
            class: "bg-warning-50 text-warning",
          },

          // ---info + variant ---
          {
            color: "info",
            variant: "outlined",
            class: "border-info text-info",
          },
          {
            color: "info",
            variant: "tonal",
            class: "bg-info-50 text-info",
          },
        ],
        defaultVariants: {
          variant: "flat",
          color: "primary",
        },
      }
    ),
    spinner: cva("absolute bottom-0 left-0 right-0 top-0 m-auto size-[1.5em]"),

    icon: cva("size-[1.5em]"),

    label: cva("font-normal", {
      variants: {
        isLoading: {
          true: "invisible opacity-0",
        },
      },
    }),
  },
};
