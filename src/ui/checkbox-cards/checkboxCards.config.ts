import { cva } from "class-variance-authority";
import {
  ringClasses,
  groupRingClasses,
  invalidRingClasses
} from "../../assets/ring.styles";

export const checkboxLabelVariants = cva(
  "text-md m-0 h-full w-full rounded-lg py-3.5 leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      isList: {
        true: "",
        false: "pr-4"
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
      `group text-control-foreground flex items-start space-x-2 transition-all duration-200`,
      {
        variants: {
          isList: {
            true: "border-b last:border-b-0",
            false: `hover:border-control-strong border-control bg-control rounded-md border shadow-2xs ${ringClasses} ${invalidRingClasses}`
          }
        }
      }
    ),
    label: checkboxLabelVariants,
    input: cva(
      `${groupRingClasses} border-control text-control-active my-3 mt-[0.9rem] mr-1 ml-3 rounded-md leading-normal`,
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
