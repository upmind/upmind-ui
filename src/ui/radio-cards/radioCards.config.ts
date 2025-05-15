import { cva } from "class-variance-authority";
import { ringClasses } from "../../assets/styles";

export const itemVariants = cva(
  `hover:border-control-strong group rounded-lg border border-control bg-control text-control-foreground shadow-sm transition-all duration-200 ${ringClasses} data-[state=checked]:bg-control-active-focus`,
  {
    variants: {
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
        12: "col-span-12 md:col-span-12",
      },
    },
    defaultVariants: {
      width: 12,
    },
  }
);

export default {
  radioCards: {
    root: cva(`grid w-full grid-cols-12 gap-2 [&>*:only-child]:col-span-12`),
    item: itemVariants,
    radio: cva("flex h-full items-start pr-2.5"),
    label: cva(
      "m-0 flex h-full w-full min-w-0 cursor-pointer items-start rounded-lg py-3.5 pr-4 text-md font-medium leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    ),
    input: cva(
      `group-hover:border-control-strong ml-4 mt-[0.1rem] border-control leading-normal ring-offset-2 [transition:border-color_200ms_ease-in-out] ${ringClasses}`
    ),
  },
};
