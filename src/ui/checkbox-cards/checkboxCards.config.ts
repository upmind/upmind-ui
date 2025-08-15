import { cva } from "class-variance-authority";
import {
  ringClasses,
  groupRingClasses,
  invalidRingClasses
} from "../../assets/ring.styles";

export const checkboxLabelVariants = cva(
  "text-md m-0 h-full w-full rounded leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
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
      `group text-control-foreground flex items-start gap-2 p-3 pr-4 transition-all duration-200`,
      {
        variants: {
          isList: {
            true: "border-b last:border-b-0",
            false: `hover:border-control-strong border-control bg-control-background rounded border ${ringClasses} ${invalidRingClasses}`
          }
        }
      }
    ),
    label: checkboxLabelVariants,
    input: cva(
      `${groupRingClasses} border-control text-control-active static pr-0 leading-normal`,
      {
        variants: {
          isList: {
            true: "pl-0!",
            false: ""
          }
        }
      }
    )
  }
};
