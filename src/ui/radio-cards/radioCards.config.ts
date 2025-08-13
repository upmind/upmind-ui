import { cva } from "class-variance-authority";
import { ringClasses } from "../../assets/ring.styles";

export const itemVariants = cva(
  `group bg-control text-control-foreground rounded-lg transition-all duration-200 ${ringClasses}`,
  {
    variants: {
      isList: {
        true: "hover:bg-control-active-focus data-[state=checked]:ring-control-active my-0.5 border-0 shadow-none data-[state=checked]:ring-2",
        false:
          "hover:border-control-strong border-control rounded-lg border shadow-2xs"
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
    radio: cva("flex h-full items-start pr-2.5"),
    label: cva(
      "text-md m-0 flex h-full w-full min-w-0 cursor-pointer items-start rounded-lg py-3.5 pr-4 leading-snug font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    ),
    sublabel: cva("text-emphasis-disabled m-0 mx-2 self-end text-sm"),
    input: cva(
      `group-hover:border-control-strong border-control mt-[0.1rem] ml-4 leading-normal ring-offset-2 [transition:border-color_200ms_ease-in-out] ${ringClasses}`
    )
  }
};
