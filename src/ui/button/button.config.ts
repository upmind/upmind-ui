// ---  external
import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../../assets/ring.styles";
// -----------------------------------------------------------------------------

export const rootVariants = cva(
  `ring-offset-background radius-button button-radius relative inline-flex items-center whitespace-nowrap no-underline transition-all duration-300`,
  {
    variants: {
      size: {
        sm: "p-2 text-sm",
        md: "gap-0.5 px-3 py-2 text-sm",
        lg: "text-md gap-0.5 px-4 py-2",
        icon: ""
      },
      variant: {
        primary:
          "from-background-button-primary-0 to-background-button-primary-1 text-text-button-primary [&:hover,&[data-hover=true]]:from-background-button-primary-hover-0 [&:hover,&[data-hover=true]]:to-background-button-primary-hover-1 ring-background-button-primary-ring! bg-gradient-to-br",
        secondary:
          "from-background-button-secondary-0 to-background-button-secondary-1 text-text-button-secondary [&:hover,&[data-hover=true]]:from-background-button-secondary-hover-0 [&:hover,&[data-hover=true]]:to-background-button-secondary-hover-1 ring-background-button-secondary-ring! bg-gradient-to-br",
        neutral:
          "from-background-button-neutral-0 to-background-button-neutral-1 text-text-button-neutral [&:hover,&[data-hover=true]]:from-background-button-neutral-hover-0 [&:hover,&[data-hover=true]]:to-background-button-neutral-hover-1 ring-background-button-neutral-ring! bg-gradient-to-br",
        subtle:
          "from-background-button-subtle-0 to-background-button-subtle-1 text-text-button-subtle [&:hover,&[data-hover=true]]:from-background-button-subtle-hover-0 [&:hover,&[data-hover=true]]:to-background-button-subtle-hover-1 ring-background-button-subtle-ring! bg-gradient-to-br",
        danger:
          "from-background-button-danger-0 to-background-button-danger-1 text-text-button-danger [&:hover,&[data-hover=true]]:from-background-button-danger-hover-0 [&:hover,&[data-hover=true]]:to-background-button-danger-hover-1 ring-background-button-danger-ring! bg-gradient-to-br",
        outline:
          "bg-background-button-outline text-text-button-outline border-button-outline [&:hover,&[data-hover=true]]:bg-background-button-outline-hover ring-background-button-outline-ring!",
        ghost:
          "bg-background-button-ghost text-text-button-ghost [&:hover,&[data-hover=true]]:bg-background-button-ghost-hover ring-background-button-ghost-ring!",
        link: "text-text-button-link [&:hover,&[data-hover=true]]:text-text-button-link-hover underline underline-offset-4 !shadow-none !ring-0 !ring-offset-0 !outline-none"
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
