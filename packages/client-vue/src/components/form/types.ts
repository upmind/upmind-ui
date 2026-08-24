import type { FormProps } from "./engine/types";

export interface FormModalProps extends Omit<FormProps, "ajv"> {
  open?: boolean;
  title?: string;
  description?: string;
  label?: string;
  cancelLabel?: string;
}
