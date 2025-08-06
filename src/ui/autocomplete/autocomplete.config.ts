import { cva } from "class-variance-authority";

import { ringClasses, invalidRingClasses } from "../input/input.config";

// ---

export const rootVariants = cva("relative rounded", {
  variants: {
    width: {
      full: "w-full",
      auto: "w-auto",
      app: "w-app"
    }
  },
  defaultVariants: {
    width: "full"
  }
});

export const anchorVariants = cva(
  `${ringClasses} ${invalidRingClasses} hover:border-control-strong flex w-dropdown-2xs items-center justify-between rounded border border-control pr-3 leading-none outline-none transition-all duration-200`,
  {
    variants: {
      size: {
        sm: "h-8 px-3 py-2 !text-sm",
        md: "h-10 px-3 py-2 !text-md",
        lg: "h-12 px-3 py-2 !text-lg"
      },
      width: {
        "3xs": "w-dropdown-3xs md:w-dropdown-2xs",
        "2xs": "w-dropdown-2xs md:w-dropdown-xs",
        xs: "w-dropdown-xs md:w-dropdown-sm",
        sm: "w-dropdown-sm md:w-dropdown-md",
        md: "w-dropdown-md md:w-dropdown-lg",
        lg: "w-dropdown-lg md:w-dropdown-xl",
        xl: "w-dropdown-xl md:w-dropdown-2xl",
        "2xl": "w-dropdown-2xl md:w-dropdown-2xl",
        full: "w-full",
        app: "w-app"
      }
    },
    defaultVariants: {
      size: "md",
      width: "full"
    }
  }
);

export const contentVariants = cva(
  "data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade absolute z-10 mt-2 max-h-96 min-w-full overflow-hidden rounded border border-control bg-base p-1 will-change-[opacity,transform] empty:hidden",
  {
    variants: {
      popoverWidth: {
        "3xs": "w-dropdown-3xs",
        "2xs": "w-dropdown-2xs",
        xs: "w-dropdown-xs",
        sm: "w-dropdown-sm",
        md: "w-dropdown-md",
        lg: "w-dropdown-lg",
        xl: "w-dropdown-xl",
        "2xl": "w-dropdown-2xl",
        full: "w-full",
        app: "w-app"
      }
    },
    defaultVariants: {
      popoverWidth: "full"
    }
  }
);

export default {
  autocomplete: {
    root: rootVariants,
    input: cva(
      "h-full min-w-0 flex-1 !bg-transparent !leading-none outline-none"
    ),
    anchor: anchorVariants,
    anchorIcon: cva(
      "ml-auto opacity-75 transition-all duration-200 group-aria-expanded:rotate-180"
    ),
    empty: cva("py-2 text-center text-xs font-medium"),
    content: contentVariants,
    item: cva(
      "data-[disabled]:text-control-disabled data-[highlighted]:bg-control-active-hover relative flex !cursor-pointer select-none items-center justify-between rounded px-3 py-2 text-sm text-control-foreground data-[disabled]:pointer-events-none data-[highlighted]:text-control-active data-[highlighted]:outline-none"
    ),
    indicator: cva("pr-2")
  }
};
