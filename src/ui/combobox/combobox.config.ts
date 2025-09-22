import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../../assets/ring.styles";

export const triggerVariants = cva(
  "text-md shadow-border-border-control h-auto justify-start gap-2 rounded px-4 py-2 transition-all duration-300",
  {
    variants: {
      width: {
        "2xs": "w-dropdown-2xs",
        xs: "w-dropdown-xs",
        sm: "w-dropdown-sm",
        md: "w-dropdown-md",
        lg: "w-dropdown-lg",
        xl: "w-dropdown-xl",
        "2xl": "w-dropdown-2xl",
        full: "w-full",
        auto: "w-auto",
        fit: "w-auto",
        app: "w-app"
      }
    },
    defaultVariants: {
      width: "full"
    }
  }
);

export const itemVariants = cva(
  "data-highlighted:bg-control-active-focus bg-base-background text-control-foreground text-md flex w-full cursor-pointer! items-center gap-3 rounded px-4 py-2",
  {
    variants: {
      color: {
        base: "data-highlighted:bg-control-active-hover",
        primary:
          "data-highlighted:bg-primary-background data-highlighted:text-primary-foreground",
        secondary:
          "data-highlighted:bg-secondary-background data-highlighted:text-secondary-foreground",
        accent:
          "data-highlighted:bg-accent-background data-highlighted:text-accent-foreground",
        promotion:
          "data-highlighted:bg-promotion-background data-highlighted:text-promotion-foreground",
        destructive:
          "data-highlighted:bg-destructive-background data-highlighted:text-destructive-foreground",
        success:
          "data-highlighted:bg-success-background data-highlighted:text-success-foreground",
        info: "data-highlighted:bg-info-background data-highlighted:text-info-foreground",
        error:
          "data-highlighted:bg-error-background data-highlighted:text-error-foreground",
        warning:
          "data-highlighted:bg-warning-background data-highlighted:text-warning-foreground"
      }
    },
    defaultVariants: {
      color: "base"
    }
  }
);

export const contentVariants = cva(
  `${ringClasses} bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 shadow-border-border-control z-50 my-1.5 rounded p-0 outline-none`,
  {
    variants: {
      color: {
        base: "",
        primary: "focus-within:ring-primary",
        secondary: "focus-within:ring-secondary",
        accent: "focus-within:ring-accent",
        promotion: "focus-within:ring-promotion",
        destructive: "focus-within:ring-destructive",
        success: "focus-within:ring-success",
        info: "focus-within:ring-info",
        error: "focus-within:ring-error",
        warning: "focus-within:ring-warning"
      },
      width: {
        "2xs": "w-dropdown-2xs",
        xs: "w-dropdown-xs",
        sm: "w-dropdown-sm",
        md: "w-dropdown-md",
        lg: "w-dropdown-lg",
        xl: "w-dropdown-xl",
        "2xl": "w-dropdown-2xl",
        full: "w-full",
        auto: "w-(--radix-popover-trigger-width)",
        fit: "w-fit",
        app: "w-app"
      }
    }
  }
);

export const labelVariants = cva("px-0.5", {
  variants: {
    truncate: {
      true: "truncate",
      false: ""
    }
  }
});

export const rootVariants = cva("w-full rounded", {
  variants: {
    hasRing: {
      true: `${ringClasses} ${invalidRingClasses}`,
      false: ""
    }
  }
});

export default {
  combobox: {
    root: rootVariants,
    trigger: triggerVariants,
    content: contentVariants,
    label: labelVariants,
    item: itemVariants,
    input: cva("rounded-none shadow-none ring-0!")
  }
};
