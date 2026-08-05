import { cva } from "class-variance-authority";

export const rootVariants = cva("flex gap-2", {
  variants: {
    orientation: {
      horizontal: "w-full items-start",
      vertical: "flex-col"
    }
  },
  defaultVariants: {
    orientation: "horizontal"
  }
});

export const itemVariants = cva("group flex gap-2", {
  variants: {
    orientation: {
      horizontal: "relative flex-1 flex-col items-center text-center",
      vertical: "w-full items-start text-left"
    }
  },
  defaultVariants: {
    orientation: "horizontal"
  }
});

export const triggerVariants = cva("flex gap-2 rounded-lg p-1", {
  variants: {
    orientation: {
      horizontal: "flex-col items-center text-center",
      vertical: "flex-row items-center text-left"
    }
  },
  defaultVariants: {
    orientation: "horizontal"
  }
});

export const separatorVariants = cva(
  "bg-accent-neutral/20 group-data-[state=completed]:bg-control-checked group-data-[disabled]:opacity-50",
  {
    variants: {
      orientation: {
        horizontal: "absolute top-5 -right-1/2 left-1/2 mx-5 h-0.5",
        vertical: "ml-5 h-8 w-px"
      }
    },
    defaultVariants: {
      orientation: "horizontal"
    }
  }
);

export default {
  stepper: {
    root: rootVariants,
    item: itemVariants,
    trigger: triggerVariants,
    indicator: cva(
      "bg-control-surface text-control-foreground shadow-control-default group-data-[state=active]:bg-control-checked group-data-[state=active]:text-control-checked-contrast group-data-[state=active]:shadow-control-checked group-data-[state=completed]:bg-control-checked group-data-[state=completed]:text-control-checked-contrast flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors duration-200 group-data-[disabled]:opacity-50"
    ),
    content: cva("flex flex-col gap-0.5"),
    title: cva("text-display text-sm font-semibold"),
    description: cva("text-muted text-xs"),
    separator: separatorVariants
  }
};
