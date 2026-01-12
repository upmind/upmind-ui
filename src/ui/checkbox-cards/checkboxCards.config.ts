import { cva } from "class-variance-authority";
import {
  ringClasses,
  groupRingClasses,
  invalidRingClasses
} from "../../assets/styles";

export const variants = {
  isList: {
    true: "border-surface border-t",
    false: `shadow-control-default [&:hover,&[data-hover=true]]:shadow-control-hover bg-control-surface control-radius ${ringClasses} ${invalidRingClasses}`
  },
  columns: {
    0: "",
    1: "col-span-12 md:col-span-12",
    2: "col-span-12 md:col-span-6",
    3: "col-span-12 md:col-span-4",
    4: "col-span-12 md:col-span-3",
    5: "col-span-12 md:col-span-2",
    6: "col-span-12 md:col-span-2"
  }
};

export const checkboxLabelVariants = cva(
  "text-md m-0 flex h-full w-full flex-col gap-1 rounded leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      isList: {
        true: "",
        false: ""
      },
      cursor: {
        pointer: "cursor-pointer",
        default: "cursor-text select-text"
      }
    }
  }
);

export default {
  checkboxCards: {
    root: cva(`grid w-full grid-cols-12 gap-2`),
    item: cva(
      `text-control-foreground group group flex items-start gap-2 rounded-none py-4 pr-4 pl-3 font-normal transition-all duration-200`,
      {
        variants: variants,
        defaultVariants: {
          columns: 1
        }
      }
    ),
    label: checkboxLabelVariants,
    input: cva(
      `${groupRingClasses} border-control-default text-control-active static pr-0 leading-normal`,
      {
        variants: {
          isList: {
            true: "pl-0!",
            false: ""
          }
        }
      }
    ),
    content: {
      root: cva("flex flex-col gap-1"),
      label: cva("text-md-tight text-display flex font-medium"),
      secondaryLabel: cva("text-md-tight text-display font-medium"),
      description: cva("text-sm-tight text-base font-normal"),
      secondaryDescription: cva("text-muted text-sm-tight font-normal"),
      action: cva("leading-none font-normal")
    }
  }
};
