import { cva } from "class-variance-authority";

// Layout mirrors shadcn-vue's Stepper example (absolute-positioned separators);
// only the colours are swapped for Upmind design tokens.

export const rootVariants = cva("flex w-full", {
  variants: {
    orientation: {
      horizontal: "items-start gap-2",
      vertical: "flex-col justify-start gap-10"
    }
  },
  defaultVariants: {
    orientation: "horizontal"
  }
});

export const itemVariants = cva("relative flex w-full", {
  variants: {
    orientation: {
      horizontal: "flex-col items-center justify-center",
      vertical: "items-start gap-6"
    }
  },
  defaultVariants: {
    orientation: "horizontal"
  }
});

// z-10 keeps the indicator above the absolute connector line.
export const triggerVariants = cva("z-10 inline-flex shrink-0");

export const separatorVariants = cva(
  "block shrink-0 rounded-full bg-accent-neutral/20 group-data-[state=completed]:bg-control-checked group-data-[disabled]:opacity-50",
  {
    variants: {
      orientation: {
        horizontal:
          "absolute top-5 left-[calc(50%+20px)] right-[calc(-50%+20px)] h-0.5",
        vertical: "absolute top-[42px] left-[20px] h-[105%] w-0.5"
      }
    },
    defaultVariants: {
      orientation: "horizontal"
    }
  }
);

export const contentVariants = cva("flex flex-col", {
  variants: {
    orientation: {
      horizontal: "mt-5 items-center gap-0.5 text-center",
      vertical: "gap-1"
    }
  },
  defaultVariants: {
    orientation: "horizontal"
  }
});

export default {
  stepper: {
    root: rootVariants,
    item: itemVariants,
    trigger: triggerVariants,
    indicator: cva(
      "bg-control-surface text-control-foreground shadow-control-default group-data-[state=active]:bg-control-checked group-data-[state=active]:text-control-checked-contrast group-data-[state=active]:shadow-control-checked group-data-[state=completed]:bg-control-checked group-data-[state=completed]:text-control-checked-contrast flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors duration-200 group-data-[disabled]:opacity-50"
    ),
    content: contentVariants,
    title: cva("text-display text-sm font-semibold"),
    description: cva("text-muted text-xs"),
    separator: separatorVariants
  }
};
