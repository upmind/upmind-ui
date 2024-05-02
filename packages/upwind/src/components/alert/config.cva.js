import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  alert: {
    root: cva("inline-flex gap-2  p-4 px-2 py-2", {
      variants: {
        anchor: {
          none: "rounded-lg",
          left: "rounded-r-lg border-l-4 border-current",
          right: "rounded-l-lg border-r-4 border-current",
          top: "rounded-b-lg border-t-4 border-current",
          bottom: "rounded-t-lg border-b-4 border-current",
        },
        variant: {
          stacked: "flex-wrap items-start",
          inline: "flex-nowrap items-center",
        },
        color: {
          base: "bg-base-50 border-base text-base-900",
          current: "bg-base-100 border-current text-current",
          primary: "bg-primary-50 text-primary-900 border-primary",
          secondary: "bg-secondary-50 text-secondary-900 border-secondary",
          accent: "bg-accent-50 text-accent-900 border-accent",
          neutral: "border-neutral bg-neutral-50 text-neutral-900",
          success: "bg-success-50 text-success-900 border-success",
          error: "bg-error-50 text-error-900 border-error",
          warning: "bg-warning-50 text-warning-900 border-warning",
          info: "bg-info-50 text-info-900 border-info",
        },
        disabled: {
          true: "!cursor-default opacity-50",
        },
        block: {
          true: "flex w-full",
          false: "max-w-sm",
        },
      },

      defaultVariants: {
        anchor: "none",
        variant: "stacked",
        color: "info",
      },
    }),

    icon: cva("size-6 p-1", {
      variants: {
        color: {
          base: "text-base",
          current: "text-current",
          primary: "text-primary",
          secondary: "text-secondary",
          accent: "text-accent",
          neutral: "text-neutral",
          success: "text-success",
          error: "text-error",
          warning: "text-warning",
          info: "text-info",
        },
      },
    }),

    content: cva("flex w-full flex-1 gap-2 overflow-hidden text-sm", {
      variants: {
        variant: {
          stacked: "flex-col items-start pb-2",
          inline: "flex-row items-center",
        },
      },
    }),
    title: cva("m-0 font-medium leading-6 text-inherit", {
      variants: {
        variant: {
          stacked: "wrap",
          inline: "truncate",
        },
        color: {
          base: "text-base",
          current: "text-current",
          primary: "text-primary",
          secondary: "text-secondary",
          accent: "text-accent",
          neutral: "text-neutral",
          success: "text-success",
          error: "text-error",
          warning: "text-warning",
          info: "text-info",
        },
      },
    }),
    text: cva("m-0", {
      variants: {
        variant: {
          stacked: "",
          inline: "flex-1 truncate leading-6  ",
        },
      },
    }),
    data: cva("m-0 text-xs", {
      variants: {
        variant: {
          stacked: "",
          inline: "truncate leading-6",
        },
      },
    }),
    actions: cva("", {
      variants: {
        variant: {
          stacked: "self-start",
          inline: "self-center",
        },
      },
    }),
    close: cva("!size-4 !rounded-full !p-3 [&>*>.icon]:!size-3"),
  },
};
