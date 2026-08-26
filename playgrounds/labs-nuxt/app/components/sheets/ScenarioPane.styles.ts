import { cva } from "class-variance-authority";
import { STEP_STATE } from "./ScenarioPane.types";

export const stepRow = cva(
  "flex w-full cursor-pointer items-center gap-3 border-l-2 px-2 py-1.5 text-left transition-colors",
  {
    variants: {
      state: {
        [STEP_STATE.CURRENT]: "bg-primary-muted border-primary font-medium",
        [STEP_STATE.DONE]: "hover:bg-neutral/10 border-transparent",
        [STEP_STATE.PENDING]:
          "hover:bg-neutral/10 border-transparent opacity-60"
      }
    },
    defaultVariants: { state: STEP_STATE.PENDING }
  }
);

export const stepIcon = cva("shrink-0", {
  variants: {
    state: {
      [STEP_STATE.CURRENT]: "text-primary",
      [STEP_STATE.DONE]: "text-success",
      [STEP_STATE.PENDING]: "text-muted"
    }
  },
  defaultVariants: { state: STEP_STATE.PENDING }
});
