import { cva } from "class-variance-authority";
import {
  ringClasses,
  groupRingClasses,
  invalidRingClasses,
} from "../../assets/styles";

export const checkboxLabelVariants = cva(
  "m-0 h-full w-full rounded-md py-3 text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      isList: {
        true: "",
        false: "pr-6",
      },
      cursor: {
        pointer: "cursor-pointer",
        default: "cursor-text select-text",
      },
    },
  }
);

export default {
  checkboxCards: {
    root: cva(`w-full`),
    item: cva(
      `group flex items-start space-x-2 text-control-foreground transition-all duration-300`,
      {
        variants: {
          isList: {
            true: "border-b last:border-b-0",
            false: `hover:bg-control-active-muted rounded-md border border-control bg-control shadow-sm ${ringClasses} ${invalidRingClasses}`,
          },
        },
      }
    ),
    label: checkboxLabelVariants,
    input: cva(
      `${groupRingClasses} my-3 ml-3 mr-1 mt-[0.9rem] rounded-md border-control leading-normal text-control-active`,
      {
        variants: {
          isList: {
            true: "!pl-0",
            false: "",
          },
        },
      }
    ),
  },
};
