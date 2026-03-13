import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const contentVariants = cva("flex w-full flex-col gap-9", {
  variants: {
    hasCard: {
      false: "",
      true: "bg-surface shadow-border-surface card-radius p-5 px-6 text-base md:p-8 md:px-9"
    }
  },
  defaultVariants: {
    hasCard: false
  }
});

export default {
  section: {
    content: contentVariants,
    title: {
      root: cva("flex items-center gap-2"),
      heading: cva("text-md-tight text-base font-medium")
    },
    tabs: {
      root: cva(""),
      list: cva(""),
      trigger: cva(""),
      icon: cva(""),
      indicator: cva("")
    }
  }
};
