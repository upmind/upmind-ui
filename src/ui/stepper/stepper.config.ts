import { cva } from "class-variance-authority";

// Connector = two flex-1 lines either side of the pill: they auto-centre the
// pill and meet the neighbouring item's line, so nothing is pinned to the
// pill's pixel size and both orientations come from swapping the flex axis.

export const rootVariants = cva("flex w-full", {
  variants: {
    orientation: {
      horizontal: "",
      vertical: "flex-col"
    }
  },
  defaultVariants: {
    orientation: "horizontal"
  }
});

// `group` is the hook the group-data-[state=…] selectors resolve against.
// gap-1 is the single pill↔content spacing knob; flex orients it per layout
// (vertical gap when horizontal/column, horizontal gap when vertical/row).
export const itemVariants = cva("group flex gap-1", {
  variants: {
    orientation: {
      horizontal: "flex-1 flex-col items-center",
      vertical: ""
    }
  },
  defaultVariants: {
    orientation: "horizontal"
  }
});

// [line][pill][line] track — runs perpendicular to the item axis.
export const railVariants = cva("flex items-center", {
  variants: {
    orientation: {
      horizontal: "w-full",
      vertical: "flex-col self-stretch"
    }
  },
  defaultVariants: {
    orientation: "horizontal"
  }
});

export const triggerVariants = cva("z-10 inline-flex shrink-0");

// Half-line. A completed step colours both halves; an active step colours its
// leading half (:first-child) so the connector into it reads as done.
export const separatorVariants = cva(
  "bg-accent-neutral/20 group-data-[state=completed]:bg-control-checked group-data-[state=active]:first:bg-control-checked flex-1 rounded-full group-data-disabled:opacity-50",
  {
    variants: {
      orientation: {
        horizontal: "h-0.5",
        // min-h gives the vertical connector its length (step spacing) so the
        // item height isn't driven by the label.
        vertical: "min-h-4 w-0.5"
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
      horizontal: "items-center text-center",
      vertical: "self-center"
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
    rail: railVariants,
    trigger: triggerVariants,
    indicator: cva(
      "bg-control-surface text-control-foreground shadow-control-default group-data-[state=active]:bg-control-checked group-data-[state=active]:text-control-checked-contrast group-data-[state=active]:shadow-control-checked group-data-[state=completed]:bg-control-checked group-data-[state=completed]:text-control-checked-contrast flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors duration-200 group-data-[disabled]:opacity-50"
    ),
    content: contentVariants,
    title: cva("text-display text-sm font-semibold"),
    description: cva("text-muted text-xs"),
    separator: separatorVariants,
    separatorHidden: cva("invisible")
  }
};
