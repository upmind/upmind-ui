import { cva } from "class-variance-authority";

export const ringClasses =
  "ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 rounded-md group-focus-within:ring-0 group-focus-within:ring-offset-0";

export const invalidRingClasses =
  "aria-invalid:!ring-invalid aria-invalid:!ring-2 aria-invalid:!ring-offset-2";

export const inputVariants = cva(
  "h-full min-w-0 flex-1 !bg-transparent !leading-none outline-none"
);

export const anchorVariants = cva(
  `${ringClasses} ${invalidRingClasses} inline-flex w-dropdown-2xs items-center justify-between rounded-md border border-control pr-3 leading-none outline-none`,
  {
    variants: {
      size: {
        sm: "h-8 px-3 py-2 !text-sm",
        md: "h-10 px-3 py-2 !text-md",
        lg: "h-12 px-3 py-2 !text-lg",
      },
      width: {
        "3xs": "max-w-dropdown-3xs w-dropdown-3xs",
        "2xs": "max-w-dropdown-2xs w-dropdown-2xs",
        xs: "max-w-dropdown-xs w-dropdown-xs",
        sm: "max-w-dropdown-sm w-dropdown-sm",
        md: "max-w-dropdown-md w-dropdown-md",
        lg: "max-w-dropdown-lg w-dropdown-lg",
        xl: "max-w-dropdown-xl w-dropdown-xl",
        "2xl": "max-w-dropdown-2xl w-dropdown-2xl",
        full: "w-full",
        auto: "w-auto",
        app: "w-app",
      },
    },
    defaultVariants: {
      size: "md",
      width: "full",
    },
  }
);

export const contentVariants = cva(
  "data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade absolute z-10 mt-2 max-h-96 w-full overflow-hidden rounded-lg border border-control bg-base will-change-[opacity,transform]",
  {
    variants: {
      dropdownWidth: {
        "3xs": "md:max-w-dropdown-3xs w-full md:w-dropdown-3xs",
        "2xs": "md:max-w-dropdown-2xs w-full md:w-dropdown-2xs",
        xs: "md:max-w-dropdown-xs w-full md:w-dropdown-xs",
        sm: "md:max-w-dropdown-sm w-full md:w-dropdown-sm",
        md: "md:max-w-dropdown-md w-full md:w-dropdown-md",
        lg: "md:max-w-dropdown-lg w-full md:w-dropdown-lg",
        xl: "md:max-w-dropdown-xl w-full md:w-dropdown-xl",
        "2xl": "md:max-w-dropdown-2xl w-full md:w-dropdown-2xl",
        full: "w-full",
        auto: "w-auto",
        app: "w-app",
      },
    },
    defaultVariants: {
      dropdownWidth: "full",
    },
  }
);

export default {
  autocomplete: {
    root: cva("relative"),
    input: inputVariants,
    anchor: anchorVariants,
    anchorIcon: cva(
      "ml-auto opacity-75 transition-all duration-200 group-aria-expanded:rotate-180"
    ),
    empty: cva("py-2 text-center text-xs font-medium"),
    content: contentVariants,
    item: cva(
      "data-[disabled]:text-control-disabled relative flex select-none items-center rounded-md px-3 py-2 text-sm text-control-foreground data-[disabled]:pointer-events-none data-[highlighted]:bg-base-100 data-[highlighted]:outline-none"
    ),
    indicator: cva(
      "absolute left-0 inline-flex w-[25px] items-center justify-center"
    ),
  },
};
