import { cva } from "class-variance-authority";
import { ringClasses } from "../../assets/ring.styles";

export const itemVariants = cva(
  `bg-background-control-surface text-control-foreground group rounded transition-all duration-200 ${ringClasses} flex cursor-pointer list-none gap-2 p-3 pr-4`,
  {
    variants: {
      isList: {
        true: "my-0.5 border-0",
        false:
          "border-border-control hover:border-border-control-hover rounded border"
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
    radio: cva("size-lh flex items-center justify-center"),
    input: cva(
      `shadow-border-border-control leading-normal ring-offset-2 [transition:border-color_200ms_ease-in-out] ${ringClasses}`
    ),
    sublabel: cva("text-text-muted m-0 mx-2 self-end text-sm")
  }
};
