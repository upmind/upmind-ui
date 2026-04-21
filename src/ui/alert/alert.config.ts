import { cva } from "class-variance-authority";

export const variants = {
  variant: {
    muted: "",
    minimal: ""
  },
  size: {
    sm: "",
    md: ""
  },
  color: {
    neutral: "",
    promo: "",
    danger: "",
    warning: "",
    success: "",
    info: ""
  }
};

export const rootVariants = cva(
  "message-radius flex w-full items-start gap-y-1",
  {
    variants: {
      variant: {
        muted: "", // Contextual background and no border
        minimal: "bg-surface border-[1.5px]" // Border and surface background
      },
      size: {
        sm: "gap-x-2 p-4",
        md: "gap-x-3 px-4 py-5"
      },
      color: variants.color
    },
    defaultVariants: {
      variant: "minimal",
      color: "neutral",
      size: "md"
    },
    compoundVariants: [
      // Minimal
      {
        variant: "minimal",
        color: "neutral",
        class: "border-accent-neutral"
      },
      {
        variant: "minimal",
        color: "promo",
        class: "border-accent-promo"
      },
      {
        variant: "minimal",
        color: "danger",
        class: "border-accent-danger"
      },
      {
        variant: "minimal",
        color: "warning",
        class: "border-accent-warning"
      },
      {
        variant: "minimal",
        color: "success",
        class: "border-accent-success"
      },
      {
        variant: "minimal",
        color: "info",
        class: "border-accent-info"
      },
      // Muted
      {
        variant: "muted",
        color: "neutral",
        class: "bg-accent-neutral-muted text-accent-neutral-muted-contrast"
      },
      {
        variant: "muted",
        color: "promo",
        class: "bg-accent-promo-muted text-accent-promo-muted-contrast"
      },
      {
        variant: "muted",
        color: "danger",
        class: "bg-accent-danger-muted text-accent-danger-muted-contrast"
      },
      {
        variant: "muted",
        color: "warning",
        class: "bg-accent-warning-muted text-accent-warning-muted-contrast"
      },
      {
        variant: "muted",
        color: "success",
        class: "bg-accent-success-muted text-accent-success-muted-contrast"
      },
      {
        variant: "muted",
        color: "info",
        class: "bg-accent-info-muted text-accent-info-muted-contrast"
      }
    ]
  }
);

const titleVariants = cva("text-md-tight font-medium", {
  variants: {
    variant: {
      muted: "",
      minimal: "text-base"
    },
    size: {
      sm: "text-sm",
      md: "text-md-tight"
    },
    color: variants.color,
    action: {
      true: "flex items-start justify-between gap-x-3",
      false: ""
    }
  },
  defaultVariants: {
    variant: "minimal",
    color: "neutral",
    size: "md",
    action: false
  },
  compoundVariants: [
    {
      variant: "muted",
      color: "neutral",
      class: "text-accent-neutral-muted-contrast"
    },
    {
      variant: "muted",
      color: "promo",
      class: "text-accent-promo-muted-contrast"
    },
    {
      variant: "muted",
      color: "danger",
      class: "text-accent-danger-muted-contrast"
    },
    {
      variant: "muted",
      color: "warning",
      class: "text-accent-warning-muted-contrast"
    },
    {
      variant: "muted",
      color: "success",
      class: "text-accent-success-muted-contrast"
    },
    {
      variant: "muted",
      color: "info",
      class: "text-accent-info-muted-contrast"
    }
  ]
});

const descriptionVariants = cva("text-sm font-normal", {
  variants: {
    variant: {
      muted: "",
      minimal: "text-muted"
    },
    size: variants.size,
    color: variants.color
  },
  defaultVariants: {
    variant: "minimal",
    color: "neutral",
    size: "md"
  },
  compoundVariants: [
    {
      variant: "muted",
      color: "neutral",
      class: "text-accent-neutral-muted-contrast"
    },
    {
      variant: "muted",
      color: "promo",
      class: "text-accent-promo-muted-contrast"
    },
    {
      variant: "muted",
      color: "danger",
      class: "text-accent-danger-muted-contrast"
    },
    {
      variant: "muted",
      color: "warning",
      class: "text-accent-warning-muted-contrast"
    },
    {
      variant: "muted",
      color: "success",
      class: "text-accent-success-muted-contrast"
    },
    {
      variant: "muted",
      color: "info",
      class: "text-accent-info-muted-contrast"
    }
  ]
});

const iconVariants = cva("p-[3px] [&>svg]:size-4.5", {
  variants: {
    variant: {
      muted: "",
      minimal: ""
    },
    size: variants.size,
    color: variants.color
  },
  defaultVariants: {
    variant: "minimal",
    color: "neutral",
    size: "md"
  },
  compoundVariants: [
    {
      variant: "muted",
      color: "neutral",
      class: "text-accent-neutral-muted-contrast"
    },
    {
      variant: "muted",
      color: "promo",
      class: "text-accent-promo-muted-contrast"
    },
    {
      variant: "muted",
      color: "danger",
      class: "text-accent-danger-muted-contrast"
    },
    {
      variant: "muted",
      color: "warning",
      class: "text-accent-warning-muted-contrast"
    },
    {
      variant: "muted",
      color: "success",
      class: "text-accent-success-muted-contrast"
    },
    {
      variant: "muted",
      color: "info",
      class: "text-accent-info-muted-contrast"
    },
    {
      variant: "minimal",
      color: "neutral",
      class: "text-accent-neutral"
    },
    {
      variant: "minimal",
      color: "promo",
      class: "text-accent-promo"
    },
    {
      variant: "minimal",
      color: "danger",
      class: "text-accent-danger"
    },
    {
      variant: "minimal",
      color: "warning",
      class: "text-accent-warning"
    },
    {
      variant: "minimal",
      color: "success",
      class: "text-accent-success"
    },
    {
      variant: "minimal",
      color: "info",
      class: "text-accent-info"
    }
  ]
});
// -----------------------------------------------------------------------------
export default {
  alert: {
    root: rootVariants,
    actionIcon: cva("p-1.5 [&>svg]:size-3"),
    content: cva("text-md-tight w-full gap-2"),
    description: descriptionVariants,
    icon: iconVariants,
    title: titleVariants
  }
};
