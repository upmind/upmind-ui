// --- external
import type { HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";
import type {
  ValidationMode,
  JsonSchema,
  UISchemaElement,
  Internationalizable,
} from "@jsonforms/core";
import type { ErrorObject } from "ajv";
import type Ajv from "ajv";

// --- internal
import type { formVariants } from "./form.config";
import type { ButtonProps } from "../button";
type FormVariantProps = VariantProps<typeof formVariants>;

// --- types
export interface FormProps {
  as: string;
  translator?: Function;
  locale?: string;
  // ---
  ajv?: Ajv;
  schema: JsonSchema;
  uischema?: UISchemaElement & Internationalizable;
  modelValue: Object;
  additionalRenderers?: Array<any>;
  // ---
  actions?: Record<string, FormAction>;
  noActions?: Boolean;
  autosave?: Boolean;
  // ---
  size?: FormVariantProps["size"];
  // ---
  loading?: Boolean;
  processing?: Boolean;
  disabled?: Boolean;
  // ---
  mode?: ValidationMode;
  additionalErrors?: ErrorObject<string, Record<string, any>, unknown>[];
  // --- Provide a way to add custom variants for a specific instance of the component
  upwindConfig?: { form: Partial<FormProps> };
  class?: HTMLAttributes["class"];
}

export interface FormAction extends ButtonProps {
  type?: HTMLButtonElement["type"];
  handler?: Function | string;
  needsValid?: boolean;
}
