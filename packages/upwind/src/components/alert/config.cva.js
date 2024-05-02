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
          base: "bg-base-100 border-base text-base",
          current: "text border-current bg-transparent",
          primary: "bg-primary-100 text-primary border-primary",
          secondary: "bg-secondary-100 text-secondary border-secondary",
          accent: "bg-accent-100 text-accent border-accent",
          neutral: "text-neutral border-neutral bg-neutral-100",
          success: "bg-success-100 text-success border-success",
          error: "bg-error-100 text-error border-error",
          warning: "bg-warning-100 text-warning border-warning",
          info: "bg-info-100 text-info border-info",
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

    icon: cva("size-6 p-1"),

    content: cva("flex w-full flex-1 gap-2 overflow-hidden text-sm", {
      variants: {
        variant: {
          stacked: "flex-col items-start",
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
