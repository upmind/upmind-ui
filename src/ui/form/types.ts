// --- external
import type { HTMLAttributes } from "vue";
import type { VariantProps, CxOptions } from "class-variance-authority";
import type {
  // ValidationMode,
  JsonSchema,
  UISchemaElement,
  Internationalizable,
  ControlElement,
  JsonFormsRendererRegistryEntry,
  JsonFormsI18nState,
  ValidationMode,
  Middleware
} from "@jsonforms/core";
import type { ErrorObject } from "ajv";
import type Ajv from "ajv";

// --- internal
import type { formVariants } from "./form.config";
import type { ButtonProps } from "../button";
type FormVariantProps = VariantProps<typeof formVariants>;

// --- types
import type { InputProps } from "../input";

export interface FormProps<T = Record<string, any>> {
  as?: string;
  // --- JSOn Forms props
  i18n?: JsonFormsI18nState;
  schema?: JsonSchema;
  uischema?: UISchemaElement & Internationalizable;
  validationMode?: ValidationMode;
  ajv?: Ajv;
  additionalErrors?: ErrorObject<string, Record<string, any>, unknown>[];
  middleware?: Middleware;
  // ---  props
  modelValue?: T;
  additionalRenderers?: any[];
  // ---
  actions?: Record<string, FormActionProps>;
  noActions?: boolean;
  autosave?: boolean;
  readonly?: boolean;
  // ---
  size?: FormVariantProps["size"] | string;
  color?: ButtonProps["color"];
  requiredText?: string;
  optionalText?: string;
  // ---
  loading?: boolean;
  processing?: boolean;
  disabled?: boolean;
  touched?: boolean;
  // ---
  // --- Provide a way to add custom variants for a specific instance of the component
  uiConfig?: { form: CxOptions };
  class?: HTMLAttributes["class"];
}

export type FormMeta = {
  canTranslate: boolean;
  isLoading: boolean;
  isProcessing: boolean;
  isPristine: boolean;
  isDirty: boolean;
  isTouched: boolean;
  isValid: boolean;
  isDisabled: boolean;
};

export interface FormActionsProps {
  meta: FormMeta;
  doReject: () => void;
  doResolve: () => void;
}

export interface FormFooterProps {
  meta: FormMeta;
}

export interface FormActionProps extends ButtonProps {
  type?: HTMLButtonElement["type"];
  handler?: Function | string;
  needsValid?: boolean;
}

export interface FormControlProps extends InputProps {
  // --- required
  id: string;
  name: string;
  // --- optional
  label?: string;
  tooltip?: string;
  text?: string;
  tags?: string[];
  description?: string;
  errors?: string | string[];
  // --- variants
  noLabel?: boolean;
  noErrors?: boolean;

  // ---state
  visible?: boolean;
  dirty?: boolean;
  touched?: boolean;
  pristine?: boolean;

  // --- styles
  uiConfig?: {
    input?: CxOptions;
    form?: {
      root: CxOptions;
      loading: CxOptions;
      content: CxOptions;
      actions: CxOptions;
    };
  };
  class?: HTMLAttributes["class"];
}

interface SharedBindingObject<TValue = any> {
  name: string;
  onBlur: (e: Event) => void;
  onInput: (e: Event | unknown) => void;
  onChange: (e: Event | unknown) => void;
  "onUpdate:modelValue"?: ((e: TValue) => unknown) | undefined;
}

export interface FieldBindingObject<TValue = any>
  extends SharedBindingObject<TValue> {
  value?: TValue;
  checked?: boolean;
}

export interface ComponentFieldBindingObject<TValue = any>
  extends SharedBindingObject<TValue> {
  modelValue?: TValue;
}

// --------------------------------------------

export interface FormControlRenderProps {
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
