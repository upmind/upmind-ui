import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  button: {
    root: cva(
      "relative inline-flex !cursor-pointer items-center justify-center gap-x-3 rounded-lg text-center leading-normal transition-all",
      {
        variants: {
          size: {
            badge: "rounded-full px-2 text-xs",
            square: "p-1",
            xs: "px-2 py-1 text-xs",
            sm: "px-3 py-2 text-sm",
            md: "px-3 py-3",
            lg: "px-3 py-4 text-lg",
          },
          variant: {
            flat: "border-transparent",
            outlined: "border bg-opacity-0 hover:bg-opacity-100",
            ghost: "border-transparent bg-opacity-0 hover:bg-opacity-100",
            link: "!bg-transparent !p-0 underline",
          },
          color: {
            current: "text-content border-transparent bg-transparent",
            base: "bg-base-200 text-base-content border-transparent",
            primary: "bg-primary text-primary-content border-transparent",
            secondary: "bg-secondary text-secondary-content border-transparent",
            accent: "bg-accent text-accent-content border-transparent",
            success: "bg-success text-success-content border-transparent",
            error: "bg-error text-error-content border-transparent",
            warning: "bg-warning text-warning-content border-transparent",
            info: "bg-info text-info-content border-transparent",
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
            disabled: false,
            color: "current",
            class: "hover:bg-base-100",
          },
          {
            disabled: false,
            color: "base",
            class: "hover:bg-base-200",
          },

          {
            disabled: false,
            color: "primary",
            class: "hover:bg-primary-800",
          },
          {
            disabled: false,
            color: "secondary",
            class: "hover:bg-secondary-800",
          },
          {
            disabled: false,
            color: "accent",
            class: "hover:bg-accent-800",
          },
          {
            disabled: false,
            color: "success",
            class: "hover:bg-success-800",
          },
          {
            disabled: false,
            color: "error",
            class: "hover:bg-error-800",
          },
          {
            disabled: false,
            color: "warning",
            class: "hover:bg-warning-800",
          },
          {
            disabled: false,
            color: "info",
            class: "hover:bg-info-800",
          },
          // --- current + variant ---
          {
            color: "current",
            variant: "outlined",
            class: "border-current text-current",
          },
          {
            color: "current",
            variant: "ghost",
            class: "text-current",
          },
          {
            color: "current",
            variant: "link",
            class: "text-current",
          },
          {
            disabled: false,
            color: "current",
            variant: ["outlined", "ghost"],
            class: "hover:bg-base-100",
          },
          {
            disabled: false,
            color: "current",
            variant: "link",
            class: "hover:text-base-800",
          },
          // --- base + variant ---
          {
            color: "base",
            variant: "outlined",
            class: "border-base-300 text-base-content",
          },

          {
            color: "base",
            variant: "ghost",
            class: "text-base-content",
          },
          {
            color: "base",
            variant: "link",
            class: "text-base-content",
          },
          {
            disabled: false,
            color: "base",
            variant: ["outlined", "ghost"],
            class: "hover:bg-base-200",
          },
          {
            disabled: false,
            color: "base",
            variant: "link",
            class: "hover:text-base-800",
          },
          // --- primary + variant ---
          {
            color: "primary",
            variant: "outlined",
            class: "border-primary text-primary",
          },
          {
            color: "primary",
            variant: "ghost",
            class: "text-primary",
          },
          {
            color: "primary",
            variant: "link",
            class: "text-primary",
          },
          {
            disabled: false,
            color: "primary",
            variant: ["outlined", "ghost"],
            class: "hover:bg-primary-50",
          },
          {
            disabled: false,
            color: "primary",
            variant: "link",
            class: "hover:text-primary-800",
          },
          // --- secondary + variant ---
          {
            color: "secondary",
            variant: "outlined",
            class: "border-secondary text-secondary",
          },
          {
            color: "secondary",
            variant: "ghost",
            class: "text-secondary",
          },
          {
            color: "secondary",
            variant: "link",
            class: "text-secondary",
          },
          {
            disabled: false,
            color: "secondary",
            variant: ["outlined", "ghost"],
            class: "hover:bg-secondary-50",
          },
          {
            disabled: false,
            color: "secondary",
            variant: "link",
            class: "hover:text-secondary-800",
          },
          // --- accent + variant ---
          {
            color: "accent",
            variant: "outlined",
            class: "border-accent text-accent",
          },
          {
            color: "accent",
            variant: "ghost",
            class: "text-accent",
          },
          {
            color: "accent",
            variant: "link",
            class: "text-accent",
          },
          {
            disabled: false,
            color: "accent",
            variant: ["outlined", "ghost"],
            class: "hover:bg-accent-50",
          },
          {
            disabled: false,
            color: "accent",
            variant: "link",
            class: "hover:text-accent-800",
          },

          // --- success + variant ---
          {
            color: "success",
            variant: "outlined",
            class: "border-success text-success",
          },
          {
            color: "success",
            variant: "ghost",
            class: "text-success",
          },
          {
            color: "success",
            variant: "link",
            class: "text-success",
          },
          {
            disabled: false,
            color: "success",
            variant: ["outlined", "ghost"],
            class: "hover:bg-success-50",
          },
          {
            disabled: false,
            color: "success",
            variant: "link",
            class: "hover:text-success-800",
          },
          // --- error + variant ---
          {
            color: "error",
            variant: "outlined",
            class: "border-error text-error",
          },
          {
            color: "error",
            variant: "ghost",
            class: "text-error",
          },
          {
            color: "error",
            variant: "link",
            class: "text-error",
          },
          {
            disabled: false,
            color: "error",
            variant: ["outlined", "ghost"],
            class: "hover:bg-error-50",
          },
          {
            disabled: false,
            color: "error",
            variant: "link",
            class: "hover:text-error-800",
          },
          // --- warning + variant ---
          {
            color: "warning",
            variant: "outlined",
            class: "border-warning text-warning",
          },
          {
            color: "warning",
            variant: "ghost",
            class: "text-warning",
          },
          {
            color: "warning",
            variant: "link",
            class: "text-warning",
          },
          {
            disabled: false,
            color: "warning",
            variant: ["outlined", "ghost"],
            class: "hover:bg-warning-50",
          },
          {
            disabled: false,
            color: "warning",
            variant: "link",
            class: "hover:text-warning-800",
          },
          // --- info + variant ---
          {
            color: "info",
            variant: "outlined",
            class: "border-info text-info",
          },
          {
            color: "info",
            variant: "ghost",
            class: "text-info",
          },
          {
            color: "info",
            variant: "link",
            class: "text-info",
          },
          {
            disabled: false,
            color: "info",
            variant: ["outlined", "ghost"],
            class: "hover:bg-info-50",
          },
          {
            disabled: false,
            color: "info",
            variant: "link",
            class: "hover:text-info-800",
          },
        ],
        defaultVariants: {
          variant: "flat",
          color: "accent",
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
    icon: cva("", {
      variants: {
        size: {
          square: "size-[1em]",
          badge: "size-4",
          xs: "size-3",
          sm: "size-4",
          md: "size-5",
          lg: "size-6",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
    content: cva("mx-auto flex items-center gap-x-3", {
      variants: {
        variant: {
          link: "!p-0",
        },

        loading: {
          true: "invisible opacity-0",
        },
        size: {
          badge: "px-0",
          xs: "px-0",
          sm: "px-1",
          medium: "px-3",
          lg: "px-5",
        },
      },

      defaultVariants: {
        size: "md",
      },
    }),
    label: cva("text-nowrap font-medium", {
      variants: {
        iconOnly: {
          true: "sr-only",
        },
      },
    }),
  },
};
