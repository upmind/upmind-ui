import { cva } from "class-variance-authority";

export const ringClasses =
  "ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 rounded-md group-focus-within:ring-0 group-focus-within:ring-offset-0";

export const invalidRingClasses =
  "aria-invalid:!ring-invalid aria-invalid:!ring-2 aria-invalid:!ring-offset-2";

export default {
  autocomplete: {
    root: cva("relative"),
    input: cva("h-full !bg-transparent outline-none"),
    anchor: cva(
      `${ringClasses} ${invalidRingClasses} inline-flex h-[35px] min-w-[160px] items-center justify-between gap-[5px] rounded-md border border-control bg-base px-[15px] text-[13px] leading-none outline-none`
    ),
    anchorIcon: cva(
      "ml-auto opacity-75 transition-all duration-200 group-aria-expanded:rotate-180"
    ),
    empty: cva("py-2 text-center text-xs font-medium"),
    content: cva(
      "data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade absolute z-10 mt-2 w-full min-w-[160px] overflow-hidden rounded-lg border border-control bg-base will-change-[opacity,transform]"
    ),
    item: cva(
      "data-[disabled]:text-control-disabled relative flex h-[25px] select-none items-center rounded-md pl-[25px] pr-[35px] text-[13px] leading-none text-control-foreground data-[disabled]:pointer-events-none data-[highlighted]:bg-base-100 data-[highlighted]:outline-none"
    ),
    indicator: cva(
      "absolute left-0 inline-flex w-[25px] items-center justify-center"
    ),
  },
};
