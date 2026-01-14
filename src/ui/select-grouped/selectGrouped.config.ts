import { cva } from "class-variance-authority";

export const groupSizeVariants = cva("", {
  variants: {
    columns: {
      0: "",
      1: "col-span-12 md:col-span-12",
      2: "col-span-12 md:col-span-6",
      3: "col-span-12 md:col-span-4",
      4: "col-span-12 md:col-span-3",
      5: "col-span-12 md:col-span-2",
      6: "col-span-12 md:col-span-2"
    }
  },
  defaultVariants: {
    columns: 1
  }
});

export const groupVariants = cva(
  `bg-control-surface text-control-foreground group control-radius shadow-control-default hover:shadow-control-hover focus:ring-ring relative z-10 flex cursor-pointer list-none gap-2 rounded py-4 pr-4 pl-3 font-normal transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-2`,
  {
    variants: {
      isOpen: {
        true: "rounded-b-none"
      }
    }
  }
);

export const dropdownVariants = cva(
  "bg-control-surface control-radius border-border w-full overflow-hidden rounded-t-none border border-t-0"
);

export const dropdownItemVariants = cva(
  `hover:bg-muted/50 data-[state=checked]:bg-muted/30 border-border flex cursor-pointer items-center gap-3 border-t px-4 py-3 transition-colors outline-none first:border-t-0`
);

export const rootVariants = cva("grid w-full grid-cols-12 gap-2");

export default {
  selectGrouped: {
    root: rootVariants,
    group: {
      root: groupVariants,
      size: groupSizeVariants
    },
    header: {
      root: cva("flex w-full items-center justify-between"),
      icon: cva("text-muted size-5 shrink-0"),
      chevron: cva(
        "text-muted size-4 shrink-0 transition-transform duration-200"
      )
    },
    dropdown: {
      root: dropdownVariants,
      item: dropdownItemVariants
    },
    radio: cva("flex shrink-0 items-center justify-center"),
    indicator: cva(
      "flex aspect-square h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full transition-none duration-0",
      {
        variants: {
          hasSelection: {
            true: "shadow-control-checked bg-control-checked",
            false: "shadow-control-default hover:shadow-control-hover"
          }
        },
        defaultVariants: {
          hasSelection: false
        }
      }
    ),
    indicatorDot: cva("text-control-checked-contrast h-2 w-2 fill-current"),
    content: {
      label: cva("text-md-tight text-display font-medium"),
      secondaryLabel: cva("text-md-tight text-muted font-medium"),
      description: cva("text-sm-tight text-base font-normal"),
      secondaryDescription: cva("text-muted text-sm-tight font-normal")
    }
  }
};
