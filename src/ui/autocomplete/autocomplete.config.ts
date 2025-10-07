import { cva } from "class-variance-authority";

import { ringClasses, invalidRingClasses } from "../../assets/ring.styles";

// ---

export const rootVariants = cva("control-radius relative", {
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
  `${ringClasses} ${invalidRingClasses} w-dropdown-2xs shadow-control-default contorl-radius flex items-center justify-between pr-3 leading-none transition-all duration-200 outline-none`,
  {
    variants: {
      size: {
        sm: "h-8 px-3 py-2 text-sm!",
        md: "text-md! h-10 px-3 py-2",
        lg: "h-12 px-3 py-2 text-lg!"
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
  "data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade border-control-default bg-base control-radius absolute z-10 mt-2 max-h-96 min-w-full overflow-hidden border p-1 will-change-[opacity,transform] empty:hidden",
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
      "h-full min-w-0 flex-1 bg-transparent! leading-none! outline-none"
    ),
    anchor: anchorVariants,
    anchorIcon: cva(
      "ml-auto opacity-75 transition-all duration-200 group-aria-expanded:rotate-180"
    ),
    empty: cva("py-2 text-center text-xs font-medium"),
    content: contentVariants,
    item: cva(
      "data-[disabled]:text-control-disabled data-highlighted:bg-control-active-hover text-control-foreground data-highlighted:text-control-active control-radius relative flex cursor-pointer! items-center justify-between px-3 py-2 text-sm select-none data-disabled:pointer-events-none data-highlighted:outline-none"
    ),
    indicator: cva("pr-2")
  }
};
