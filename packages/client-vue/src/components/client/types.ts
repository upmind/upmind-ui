import type { ButtonProps } from "@upmind-automation/ui";
import type { ActorRef } from "xstate";

export interface ClientItemProps {
  modelValue: ActorRef<any, any>;
  i18nKey: string;
  open?: boolean;
  modal?: boolean;
  nested?: boolean;
  autosave?: boolean;
  skrim?: string;
  color?: ButtonProps["color"];
}
