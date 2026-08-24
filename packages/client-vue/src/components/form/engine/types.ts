import type { formVariants } from "./variants";
import type {
  JsonSchema,
  UISchemaElement,
  Internationalizable,
  ControlElement,
  JsonFormsRendererRegistryEntry,
  JsonFormsI18nState,
  ValidationMode,
  Middleware
} from "@jsonforms/core";
import type { ButtonVariants } from "@upmind/ui";
import type { ErrorObject } from "ajv";
import type Ajv from "ajv";
import type { VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";

// -----------------------------------------------------------------------------
// Ported from the old lib's form/types.ts (FE-2941). Off old-lib ButtonProps/
// InputProps → new-lib ButtonVariants; the retired `uiConfig` channel (D-3) is
// dropped; FormControlProps no longer extends InputProps (FormField is chrome,
// not an input — it forwards nothing), keeping only the fields it consumes.

type FormVariantProps = VariantProps<typeof formVariants>;

export type FormProps<T = Record<string, any>> = {
  /** data-* attributes (e.g. test ids) forwarded to the form root. */
  dataAttrs?: Record<string, string>;
  as?: string;
  // --- JSON Forms props
  i18n?: JsonFormsI18nState;
  schema?: JsonSchema;
  uischema?: UISchemaElement & Internationalizable;
  validationMode?: ValidationMode;
  ajv?: Ajv;
  additionalErrors?: ErrorObject<string, Record<string, any>, unknown>[];
  middleware?: Middleware;
  // --- props
  modelValue?: T;
  additionalRenderers?: any[];
  // ---
  actions?: Record<string, FormActionProps>;
  noActions?: boolean;
  autosave?: boolean;
  readonly?: boolean;
  // ---
  size?: FormVariantProps["size"] | string;
  variant?: ButtonVariants["variant"];
  requiredText?: string;
  optionalText?: string;
  // ---
  loading?: boolean;
  processing?: boolean;
  disabled?: boolean;
  touched?: boolean;
  // ---
  class?: HTMLAttributes["class"];
};

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

export type FormActionsProps = {
  meta: FormMeta;
  doReject: () => void;
  doResolve: () => void;
};

export type FormAdditionalProps = {
  meta: FormMeta;
};

export type FormFooterProps = {
  meta: FormMeta;
};

export type FormActionProps = {
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
  block?: boolean;
  loading?: boolean;
  disabled?: boolean;
  type?: "submit" | "reset" | "button";
  label?: string;
  icon?: string;
  handler?: ((...args: unknown[]) => unknown) | string;
  needsValid?: boolean;
  /** data-* attributes (e.g. test ids) forwarded to the action button. */
  dataAttrs?: Record<string, string>;
};

export type FormControlProps = {
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
  requiredText?: string;
  optionalText?: string;
  // --- variants
  noLabel?: boolean;
  noErrors?: boolean;
  // --- state
  required?: boolean;
  disabled?: boolean;
  visible?: boolean;
  dirty?: boolean;
  touched?: boolean;
  autoFocus?: boolean;
  // --- styles
  icon?: string;
  class?: HTMLAttributes["class"];
};

type SharedBindingObject<TValue = any> = {
  name: string;
  onBlur: (e: Event) => void;
  onInput: (e: Event | unknown) => void;
  onChange: (e: Event | unknown) => void;
  "onUpdate:modelValue"?: ((e: TValue) => unknown) | undefined;
};

export type FieldBindingObject<TValue = any> = SharedBindingObject<TValue> & {
  value?: TValue;
  checked?: boolean;
};

export type ComponentFieldBindingObject<TValue = any> =
  SharedBindingObject<TValue> & {
    modelValue?: TValue;
  };

export type FormControlRenderProps = {
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
};
