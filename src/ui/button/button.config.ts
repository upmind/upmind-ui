// ---  external
import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../../assets/ring.styles";
// -----------------------------------------------------------------------------

export const rootVariants = cva(
  `ring-offset-background radius-button button-radius relative inline-flex items-center whitespace-nowrap no-underline transition-all duration-300`,
  {
    variants: {
      size: {
        sm: "px-0.5 py-2 text-sm",
        md: "gap-0.5 px-3 py-2 text-sm",
        lg: "text-md gap-0.5 px-4 py-2",
        icon: ""
      },
      variant: {
        primary:
          "from-background-button-primary0 to-background-button-primary1 text-button-primary bg-gradient-to-br",
        secondary:
          "from-background-button-secondary0 to-background-button-secondary1 text-button-secondary bg-gradient-to-br",
        neutral:
          "from-background-button-neutral0 to-background-button-neutral1 text-button-neutral bg-gradient-to-br",
        subtle:
          "from-background-button-subtle0 to-background-button-subtle1 text-button-subtle bg-gradient-to-br",
        danger:
          "from-background-button-danger0 to-background-button-danger1 text-button-danger bg-gradient-to-br",
        outline:
          "bg-background-button-outline text-button-outline border-button-outline",
        ghost: "bg-background-button-ghost text-button-ghost",
        link: "text-button-link"
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
      isPill: {
        true: "rounded-pill",
        false: "rounded"
      },
      hasRing: {
        true: `${ringClasses} ${invalidRingClasses}`,
        false: "outline-none focus:ring-0 focus:outline-none"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      isBlock: false,
      isLoading: false,
      isPill: false
    }
  }
);

const labelVariants = cva("", {
  variants: {
    variant: {
      flat: "px-1",
      outline: "px-1",
      ghost: "px-1",
      link: "",
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
    variant: {
      link: "text-emphasis-medium"
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
