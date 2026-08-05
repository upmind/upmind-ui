import type { IconProps } from "../icon";
import type { CxOptions } from "class-variance-authority";
import type { StepperRootProps } from "radix-vue";
import type { HTMLAttributes } from "vue";

export type StepperStepProps = {
  step: number;
  title?: string;
  description?: string;
  icon?: IconProps["icon"];
  disabled?: boolean;
  completed?: boolean;
};

export type StepperProps = Omit<
  StepperRootProps,
  "modelValue" | "defaultValue" | "orientation"
> & {
  modelValue?: number;
  defaultValue?: number;
  // --- state
  steps: StepperStepProps[];
  // --- variants
  orientation?: "horizontal" | "vertical";
  // --- styles
  uiConfig?: {
    stepper: {
      root?: CxOptions;
      item?: CxOptions;
      trigger?: CxOptions;
      indicator?: CxOptions;
      content?: CxOptions;
      title?: CxOptions;
      description?: CxOptions;
      separator?: CxOptions;
    };
  };
  class?: HTMLAttributes["class"];
  itemClass?: HTMLAttributes["class"];
};
