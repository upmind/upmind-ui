import { cva } from "class-variance-authority";
import { ringClasses } from "../../assets/styles";

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
  `bg-control-surface text-control-foreground group control-radius shadow-control-default hover:shadow-control-hover focus-within:ring-ring data-[state=checked]:ring-ring flex cursor-pointer list-none gap-2 rounded py-4 pr-4 pl-3 font-normal transition-all duration-200 focus-within:ring-2 focus-within:ring-offset-2 data-[state=checked]:ring-2 data-[state=checked]:ring-offset-2 ${ringClasses}`
);

export const dropdownVariants = cva(
  "bg-control-surface mt-2 w-full overflow-hidden rounded-md"
);

export const dropdownItemVariants = cva(
  `hover:bg-muted/50 data-[state=checked]:bg-muted/30 flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${ringClasses}`
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
      "border-muted data-[state=checked]:border-primary data-[state=checked]:bg-primary flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors"
    ),
    indicatorDot: cva(
      "h-2 w-2 rounded-full bg-white opacity-0 transition-opacity data-[state=checked]:opacity-100"
    ),
    content: {
      label: cva("text-md-tight text-display font-medium"),
      secondaryLabel: cva("text-md-tight text-display font-medium"),
      description: cva("text-sm-tight text-base font-normal"),
      secondaryDescription: cva("text-muted text-sm-tight font-normal")
    }
  }
};
