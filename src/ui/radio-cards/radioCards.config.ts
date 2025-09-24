import { cva } from "class-variance-authority";
import { ringClasses } from "../../assets/ring.styles";

export const itemVariants = cva(
  `bg-background-control-surface text-control-foreground group rounded font-normal transition-all duration-200 ${ringClasses} flex cursor-pointer list-none gap-2 py-4 pr-4 pl-3`,
  {
    variants: {
      isList: {
        true: "my-0.5 border-0",
        false:
          "shadow-border-border-control-default hover:shadow-border-border-control-hover rounded"
      },
      width: {
        0: "",
        1: "col-span-12 md:col-span-1",
        2: "col-span-12 md:col-span-2",
        3: "col-span-12 md:col-span-3",
        4: "col-span-12 md:col-span-4",
        5: "col-span-12 md:col-span-5",
        6: "col-span-12 md:col-span-6",
        7: "col-span-12 md:col-span-7",
        8: "col-span-12 md:col-span-8",
        9: "col-span-12 md:col-span-9",
        10: "col-span-12 md:col-span-10",
        11: "col-span-12 md:col-span-11",
        12: "col-span-12 md:col-span-12"
      }
    },
    defaultVariants: {
      isList: false,
      width: 12
    }
  }
);

export const rootVariants = cva(`w-full`, {
  variants: {
    isList: {
      true: "flex flex-col gap-1",
      false: "grid grid-cols-12 gap-2 [&>*:only-child]:col-span-12"
    }
  },
  defaultVariants: {
    isList: false
  }
});
export default {
  radioCards: {
    root: rootVariants,
    item: itemVariants,
    radio: cva("size-lh text-md/tight flex items-center justify-center"),
    content: {
      label: cva("text-md/tight text-text-display font-medium"),
      sublabel: cva("text-md/tight text-text-display font-medium"),
      labelRowA: cva("text-text-base text-sm/tight"),
      labelRowB: cva("text-text-muted text-sm/tight")
    }
  }
};
