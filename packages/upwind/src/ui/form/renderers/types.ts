import type { FormControlProps } from "../types";
import type {
  ControlElement,
  JsonFormsRendererRegistryEntry,
} from "@jsonforms/core";
import type { JsonSchema } from "@jsonforms/core";
// --------------------------------------------

export interface Control {
  uischema: ControlElement;
  schema: NonNullable<JsonSchema>;
  path: string;
  enabled: boolean;
  renderers: JsonFormsRendererRegistryEntry[];
  data: any;
  label: string;
  description: string;
  required: boolean;
  visible: boolean;
  config: any;
  id: string;
  errors: string | string[];
}
export interface Options extends FormControlProps {
  // --- DEPRECATED
  // appendAvatar?: IconProps;
  // appendIcon?: IconProps;
  // noFeedback?: boolean;
  // noRequired?: boolean;
  // noStatus?: boolean;
  // optionalText?: String;
  // focusDescription?: boolean;
  // prefix?: String;
  // prependAvatar?: IconProps;
  // prependIcon?: IconProps;
  // requiredText?: String;
  // suffix?: String;
}
