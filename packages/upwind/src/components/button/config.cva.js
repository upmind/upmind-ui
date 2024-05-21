import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  button: {
    root: cva(
      "relative inline-flex !cursor-pointer items-center justify-center gap-x-3 rounded-lg text-center leading-normal transition-all",
      {
        variants: {
          size: {
            sm: "px-3 py-2 text-sm",
            md: "px-3 py-3",
            lg: "px-3 py-4 text-lg",
          },
          variant: {
            flat: "border-transparent",
            outlined: "border bg-opacity-0 hover:bg-opacity-100",
            ghost: "border-transparent bg-opacity-0 hover:bg-opacity-100",
            link: "!bg-transparent !p-0 hover:underline",
          },
          color: {
            current:
              "hover:bg-base-100 text-content border-transparent bg-transparent",
            primary:
              "bg-primary hover:bg-primary-800 text-primary-content border-transparent",
            secondary:
              "bg-secondary text-secondary-content hover:bg-secondary-800 border-transparent",
            accent:
              "bg-accent text-accent-content hover:bg-accent-800 border-transparent",
            neutral:
              "bg-neutral text-neutral-content border-transparent hover:bg-neutral-800",
            success:
              "bg-success text-success-content hover:bg-success-800 border-transparent",
            error:
              "bg-error text-error-content hover:bg-error-800 border-transparent",
            warning:
              "bg-warning text-warning-content hover:bg-warning-800 border-transparent",
            info: "bg-info text-info-content hover:bg-info-800 border-transparent",
          },
          disabled: {
            true: "!cursor-default opacity-50",
          },
          block: {
            true: "flex w-full",
          },
        },
        compoundVariants: [
          // disabled + color
          {
            disabled: true,
            color: "current",
            class: "hover:bg-transparent",
          },

          {
            disabled: true,
            color: "primary",
            class: "hover:bg-primary",
          },
          {
            disabled: true,
            color: "secondary",
            class: "hover:bg-secondary",
          },
          {
            disabled: true,
            color: "accent",
            class: "hover:bg-accent",
          },
          {
            disabled: true,
            color: "neutral",
            class: "hover:bg-neutral",
          },
          {
            disabled: true,
            color: "success",
            class: "hover:bg-success",
          },
          {
            disabled: true,
            color: "error",
            class: "hover:bg-error",
          },
          {
            disabled: true,
            color: "warning",
            class: "hover:bg-warning",
          },
          {
            disabled: true,
            color: "info",
            class: "hover:bg-info",
          },
          // --- current + variant ---
          {
            color: "current",
            variant: "outlined",
            class: "hover:bg-base-100 border-current text-current",
          },
          {
            color: "current",
            variant: "ghost",
            class: "hover:bg-base-100 text-current",
          },
          {
            color: "current",
            variant: "link",
            class: "text-current",
          },
          // --- primary + variant ---
          {
            color: "primary",
            variant: "outlined",
            class: "border-primary hover:bg-primary-50 text-primary",
          },
          {
            color: "primary",
            variant: "ghost",
            class: "hover:bg-primary-50 text-primary",
          },
          {
            color: "primary",
            variant: "link",
            class: "text-primary",
          },
          // --- secondary + variant ---
          {
            color: "secondary",
            variant: "outlined",
            class: "border-secondary hover:bg-secondary-50 text-secondary",
          },
          {
            color: "secondary",
            variant: "ghost",
            class: "hover:bg-secondary-50 text-secondary",
          },
          {
            color: "secondary",
            variant: "link",
            class: "text-secondary",
          },
          // --- accent + variant ---
          {
            color: "accent",
            variant: "outlined",
            class: "border-accent hover:bg-accent-50 text-accent",
          },
          {
            color: "accent",
            variant: "ghost",
            class: "hover:bg-accent-50 text-accent",
          },
          {
            color: "accent",
            variant: "link",
            class: "text-accent",
          },
          // --- neutral + variant ---
          {
            color: "neutral",
            variant: "outlined",
            class: "border-neutral text-neutral hover:bg-neutral-50",
          },
          {
            color: "neutral",
            variant: "ghost",
            class: "text-neutral hover:bg-neutral-50",
          },
          {
            color: "neutral",
            variant: "link",
            class: "text-neutral",
          },
          // --- success + variant ---
          {
            color: "success",
            variant: "outlined",
            class: "border-success hover:bg-success-50 text-success",
          },
          {
            color: "success",
            variant: "ghost",
            class: "hover:bg-success-50 text-success",
          },
          {
            color: "success",
            variant: "link",
            class: "text-success",
          },
          // --- error + variant ---
          {
            color: "error",
            variant: "outlined",
            class: "border-error hover:bg-error-50 text-error",
          },
          {
            color: "error",
            variant: "ghost",
            class: "hover:bg-error-50 text-error",
          },
          {
            color: "error",
            variant: "link",
            class: "text-error",
          },
          // --- warning + variant ---
          {
            color: "warning",
            variant: "outlined",
            class: "border-warning hover:bg-warning-50 text-warning",
          },
          {
            color: "warning",
            variant: "ghost",
            class: "hover:bg-warning-50 text-warning",
          },
          {
            color: "warning",
            variant: "link",
            class: "text-warning",
          },
          // --- info + variant ---
          {
            color: "info",
            variant: "outlined",
            class: "border-info hover:bg-info-50 text-info",
          },
          {
            color: "info",
            variant: "ghost",
            class: "hover:bg-info-50 text-info",
          },
          {
            color: "info",
            variant: "link",
            class: "text-info",
          },
        ],
        defaultVariants: {
          variant: "flat",
          color: "primary",
          size: "md",
        },
      }
    ),
    spinner: cva("absolute bottom-0 left-0 right-0 top-0 m-auto size-[1.5em]"),
    avatar: cva("size-[1.5em] overflow-hidden rounded-full", {
      variants: {
        loading: {
          true: "invisible opacity-0",
        },
        iconOnly: {
          true: "hidden",
        },
      },
    }),
    icon: cva("size-[1.5em]"),
    content: cva("mx-auto flex items-center gap-x-3", {
      variants: {
        variant: {
          link: "!p-0",
        },

        loading: {
          true: "invisible opacity-0",
        },
        size: {
          sm: "px-1",
          medium: "px-3",
          lg: "px-5",
        },
      },

      defaultVariants: {
        size: "md",
      },
    }),
    label: cva("text-nowrap font-semibold", {
      variants: {
        iconOnly: {
          true: "sr-only",
        },
      },
    }),
  },
};
