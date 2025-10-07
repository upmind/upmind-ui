import { cva } from "class-variance-authority";
import {
  ringClasses,
  groupRingClasses,
  invalidRingClasses
} from "../../assets/ring.styles";

export const checkboxLabelVariants = cva(
  "text-md m-0 h-full w-full rounded leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
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
    root: cva(`grid w-full gap-2`),
    item: cva(
      `text-control-foreground group group flex items-start gap-2 rounded-none py-4 pr-4 pl-3 font-normal transition-all duration-200`,
      {
        variants: {
          isList: {
            true: "border-control-default border-b last:border-b-0",
            false: `shadow-control-default [&:hover,&[data-hover=true]]:shadow-control-hover bg-control-surface control-radius ${ringClasses} ${invalidRingClasses}`
          }
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
      label: cva("text-md/tight text-display font-medium"),
      secondaryLabel: cva("text-md/tight text-display font-medium"),
      description: cva("text-base text-sm/tight font-normal"),
      secondaryDescription: cva("text-muted text-sm/tight font-normal")
    }
  }
};
