import type { FormProps } from "@upmind-automation/upmind-ui";

export interface FormModalProps extends Omit<FormProps, "ajv"> {
  open?: boolean;
  title?: string;
  description?: string;
  label?: string;
  cancelLabel?: string;
}
