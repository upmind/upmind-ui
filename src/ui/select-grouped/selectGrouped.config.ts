import { cva } from "class-variance-authority";
import { baseRing } from "../../assets/styles";

const focusRing = `${baseRing} [&:focus,&[data-focus=true]]:outline-[var(--color-control-ring)]`;

export const groupSizeVariants = cva("col-span-12");

export const groupVariants = cva(
  `bg-control-surface text-control-foreground group control-radius shadow-control-default hover:shadow-control-hover relative z-10 flex cursor-pointer list-none gap-2 rounded py-4 pr-4 pl-3 font-normal transition-all duration-200 ${focusRing}`,
  {
    variants: {
      isOpen: {
        true: "rounded-b-none !outline-transparent",
        false: ""
      }
    },
    defaultVariants: {
      isOpen: false
    }
  }
);

export const dropdownVariants = cva(
  "bg-control-surface control-radius border-border w-full rounded-t-none border border-t-0"
);

export const dropdownItemVariants = cva(
  `border-border data-[focused=true]:bg-muted flex cursor-pointer items-center gap-3 border-t px-4 py-3 outline outline-2 -outline-offset-4 outline-transparent transition-colors first:border-t-0 data-[focused=true]:outline-[var(--color-control-ring)]`
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
        "text-muted ml-2 size-4 shrink-0 transition-transform duration-200"
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
