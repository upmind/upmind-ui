import { cva } from "class-variance-authority";
import { focusWithinRing, focusRing } from "../../assets/styles";

export const groupSizeVariants = cva("col-span-12");

export const groupWrapperVariants = cva(`control-radius ${focusWithinRing}`, {
  variants: {
    isOpen: {
      true: "rounded-b-none",
      false: ""
    }
  },
  defaultVariants: {
    isOpen: false
  }
});

export const groupSingleVariants = cva(
  `bg-control-surface text-control-foreground control-radius shadow-control-default hover:shadow-control-hover relative flex cursor-pointer list-none gap-2 rounded py-4 pr-4 pl-3 font-normal transition-shadow duration-200 ${focusRing}`
);

export const groupVariants = cva(
  `bg-control-surface text-control-foreground control-radius shadow-control-default hover:shadow-control-hover relative flex cursor-pointer list-none gap-2 rounded py-4 pr-4 pl-3 font-normal transition-shadow duration-200 outline-none focus:outline-none focus-visible:outline-none`,
  {
    variants: {
      isOpen: {
        true: "rounded-b-none",
        false: ""
      }
    },
    defaultVariants: {
      isOpen: false
    }
  }
);

export const dropdownVariants = cva(
  "group/dropdown bg-control-surface control-radius border-border w-full rounded-t-none border border-t-0"
);

export const dropdownItemVariants = cva(
  `group/item border-border data-[focused=true]:bg-muted flex cursor-pointer items-start gap-3 border-t px-4 py-3 transition-colors first:border-t-0`
);

export const rootVariants = cva("grid w-full grid-cols-12 gap-2");

export default {
  selectGrouped: {
    root: rootVariants,
    group: {
      root: groupVariants,
      singleRoot: groupSingleVariants,
      wrapper: groupWrapperVariants,
      size: groupSizeVariants
    },
    header: {
      root: cva("flex w-full items-start justify-between gap-2"),
      icon: cva("text-muted size-5 shrink-0"),
      chevron: cva(
        "text-muted ml-2 size-4 shrink-0 transition-transform duration-200"
      )
    },
    dropdown: {
      root: dropdownVariants,
      item: dropdownItemVariants
    },
    radio: cva("size-lh flex shrink-0 items-center justify-center"),
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
      label: cva("text-md-tight font-medium"),
      secondaryLabel: cva("text-md-tight font-medium"),
      description: cva("text-sm-tight text-base font-normal"),
      secondaryDescription: cva("text-muted text-sm-tight font-normal")
    }
  }
};
