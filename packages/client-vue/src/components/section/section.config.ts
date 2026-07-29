import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

// Inset: the surface/border/radius + horizontal padding live on the
// outer wrapper so the header sits WITHIN the card above an inset divider (the
// header <header> is full-width, so the divider spans the padded width). The
// header row and content then carry only vertical padding.
// Enclosed/stepped cards are NOT inset — the card box sits on the content and
// the header/tabs render OUTSIDE it (as originally); the wrapper stays unstyled.
// Non-card usages (hasCard=false) are unaffected either way.
export const wrapperVariants = cva("min-w-0", {
  variants: {
    isInset: {
      false: "",
      true: "bg-surface shadow-border-surface card-radius px-6 md:px-9"
    }
  },
  defaultVariants: {
    isInset: false
  }
});

// Header divider only when inset; enclosed keeps no header divider.
// Disabled collapses the inset card to its title row (no divider, own pb).
export const rootVariants = cva("", {
  variants: {
    isInset: {
      false: "",
      true: "pt-5 md:pt-6"
    },
    isDisabled: {
      false: "",
      true: ""
    }
  },
  compoundVariants: [
    {
      isInset: true,
      isDisabled: false,
      class: "border-surface border-b"
    },
    {
      isInset: true,
      isDisabled: true,
      class: "pb-5 md:pb-6"
    }
  ],
  defaultVariants: {
    isInset: false,
    isDisabled: false
  }
});

// A title-only inset card has no divider, so the trigger's base pb-4 goes too.
export const triggerVariants = cva("", {
  variants: {
    isInset: {
      false: "",
      true: ""
    },
    isDisabled: {
      false: "",
      true: "opacity-50"
    }
  },
  compoundVariants: [
    {
      isInset: true,
      isDisabled: true,
      class: "pb-0"
    }
  ],
  defaultVariants: {
    isInset: false,
    isDisabled: false
  }
});

// Inset: content carries vertical padding only — the box is on the
// wrapper. Enclosed card (hasCard && !isInset): the card box lives HERE on the
// content with the header outside — the original behaviour. Non-card: base only.
export const contentVariants = cva("flex w-full flex-col gap-9", {
  variants: {
    hasCard: {
      false: "",
      true: ""
    },
    isInset: {
      false: "",
      true: "py-5 text-base md:py-6"
    }
  },
  compoundVariants: [
    {
      hasCard: true,
      isInset: false,
      class:
        "bg-surface shadow-border-surface card-radius p-5 px-6 text-base md:p-8 md:px-9"
    }
  ],
  defaultVariants: {
    hasCard: false,
    isInset: false
  }
});

export default {
  section: {
    wrapper: wrapperVariants,
    content: contentVariants,
    title: {
      root: cva("flex items-center gap-2"),
      heading: cva("text-md-tight text-base font-medium")
    },
    tabs: {
      root: rootVariants,
      list: cva(""),
      trigger: triggerVariants,
      icon: cva(""),
      indicator: cva("")
    }
  }
};
