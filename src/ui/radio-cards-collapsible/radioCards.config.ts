import { cva } from "class-variance-authority";
import { ringClasses } from "../../assets/ring.styles";

export const itemVariants = cva(
  `bg-control-background text-control-foreground group rounded transition-all duration-200 ${ringClasses} flex list-none gap-2 p-3 pr-4`,
  {
    variants: {
      isList: {
        true: "hover:bg-control-active-focus data-[state=checked]:ring-control-active my-0.5 border-0 shadow-none data-[state=checked]:ring-2",
        false: "hover:border-control-strong border-control rounded border"
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
      true: "flex flex-col",
      false: "grid grid-cols-1"
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
      `group-hover:border-control-strong leading-normal [transition:border-color_200ms_ease-in-out]`
    )
  }
};
