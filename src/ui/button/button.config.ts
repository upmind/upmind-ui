// ---  external
import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../../assets/ring.styles";
// -----------------------------------------------------------------------------

export const variants = {
  size: {
    sm: "p-2 text-sm",
    md: "gap-0.5 px-3 py-2 text-sm",
    lg: "text-md gap-0.5 px-4 py-2",
    icon: ""
  },
  variant: {
    primary:
      "button-radius from-bg-button-primary-0 to-bg-button-primary-1 text-button-primary [&:hover:not(:disabled),&[data-hover=true]:not([data-disabled=true])]:from-bg-button-primary-hover-0 [&:hover:not(:disabled),&[data-hover=true]:not([data-disabled=true])]:to-bg-button-primary-hover-1 ring-primary-ring! bg-gradient-to-br",
    secondary:
      "button-radius from-bg-button-secondary-0 to-bg-button-secondary-1 text-button-secondary [&:hover:not(:disabled),&[data-hover=true]:not([data-disabled=true])]:from-bg-button-secondary-hover-0 [&:hover:not(:disabled),&[data-hover=true]:not([data-disabled=true])]:to-bg-button-secondary-hover-1 ring-secondary-ring! bg-gradient-to-br",
    neutral:
      "button-radius from-bg-button-neutral-0 to-bg-button-neutral-1 text-button-neutral [&:hover:not(:disabled),&[data-hover=true]:not([data-disabled=true])]:from-bg-button-neutral-hover-0 [&:hover:not(:disabled),&[data-hover=true]:not([data-disabled=true])]:to-bg-button-neutral-hover-1 ring-neutral-ring! bg-gradient-to-br",
    subtle:
      "button-radius from-bg-button-subtle-0 to-bg-button-subtle-1 text-button-subtle [&:hover:not(:disabled),&[data-hover=true]:not([data-disabled=true])]:from-bg-button-subtle-hover-0 [&:hover:not(:disabled),&[data-hover=true]:not([data-disabled=true])]:to-bg-button-subtle-hover-1 ring-subtle-ring! bg-gradient-to-br",
    danger:
      "button-radius from-bg-button-danger-0 to-bg-button-danger-1 text-button-danger [&:hover:not(:disabled),&[data-hover=true]:not([data-disabled=true])]:from-bg-button-danger-hover-0 [&:hover:not(:disabled),&[data-hover=true]:not([data-disabled=true])]:to-bg-button-danger-hover-1 ring-danger-ring! bg-gradient-to-br",
    outline:
      "button-radius bg-button-outline text-button-outline [&:hover:not(:disabled),&[data-hover=true]:not([data-disabled=true])]:bg-button-outline-hover ring-outline-ring! shadow-button-outline",
    ghost:
      "button-radius bg-button-ghost text-button-ghost [&:hover:not(:disabled),&:focus-within:not(:disabled),&[data-hover=true]:not([data-disabled=true]),&[data-focus=true]:not([data-disabled=true])]:bg-button-ghost-hover ring-ghost-ring!",
    control:
      "control-radius shadow-control-default hover:not(:disabled):border-control-hover ring-control-ring!"
  },
  align: {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end"
  },
  isBlock: {
    true: "w-full basis-full"
  },
  isLoading: {
    true: "pointer-events-none"
  },
  isDisabled: {
    true: "cursor-not-allowed opacity-50",
    false: "cursor-pointer"
  },
  hasRing: {
    true: `${ringClasses} ${invalidRingClasses}`,
    false: "outline-none focus:ring-0 focus:outline-none"
  }
};

export const rootVariants = cva(
  `ring-offset-canvas relative inline-flex items-center font-medium whitespace-nowrap no-underline transition-all duration-200`,
  {
    variants,
    defaultVariants: {
      variant: "primary",
      size: "md",
      isBlock: false,
      isLoading: false
    }
  }
);

const labelVariants = cva("", {
  variants: {
    variant: {
      flat: "px-1",
      outline: "px-1",
      ghost: "px-1",
      tonal: "px-1",
      inverse: "px-1",
      control: "px-1"
    },
    isIconOnly: {
      true: "sr-only"
    },
    isLoading: {
      true: "opacity-0"
    }
  }
});

const itemsVariants = cva("size-lh flex items-center justify-center", {
  variants: {
    size: {
      icon: "",
      sm: "[&>i]:p-[3px]",
      md: "[&>i]:p-[3px]",
      lg: "[&>i]:p-[4px]"
    },
    isLoading: {
      true: "opacity-0"
    }
  }
});

// -----------------------------------------------------------------------------
export default {
  button: {
    root: rootVariants,
    label: labelVariants,
    items: itemsVariants
  }
};
