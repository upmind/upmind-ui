// ---  external
import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../../assets/ring.styles";

export const textareaVariants = cva(
  `bg-background-control-surface text-md [&:hover,&[data-hover=true]]:shadow-border-border-control-hover shadow-border-border-control-default text-control-foreground placeholder:text-muted-foreground control-radius flex min-h-20 w-full border-0 px-4 py-2 transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 ${ringClasses} ${invalidRingClasses}`
);

// -----------------------------------------------------------------------------
export default {
  textarea: textareaVariants
};
