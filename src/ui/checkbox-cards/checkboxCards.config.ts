import { cva } from "class-variance-authority";
import {
  ringClasses,
  groupRingClasses,
  invalidRingClasses
} from "../../assets/styles";

export const checkboxLabelVariants = cva(
  "m-0 h-full w-full rounded text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
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
      `group flex items-start gap-2 p-3 pr-4 text-control-foreground transition-all duration-200`,
      {
        variants: {
          isList: {
            true: "border-b last:border-b-0",
            false: `hover:border-control-strong rounded border border-control bg-control shadow-sm ${ringClasses} ${invalidRingClasses}`
          }
        }
      }
    ),
    label: checkboxLabelVariants,
    input: cva(
      `${groupRingClasses} static border-control pr-0 leading-normal text-control-active`,
      {
        variants: {
          isList: {
            true: "!pl-0",
            false: ""
          }
        }
      }
    )
  }
};
