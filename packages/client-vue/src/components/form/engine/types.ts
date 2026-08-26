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
import type { BadgeVariants, ButtonVariants, InputVariants } from "@upmind/ui";
import type { ErrorObject } from "ajv";
import type Ajv from "ajv";
import type { HTMLAttributes } from "vue";

// -----------------------------------------------------------------------------
// Ported from the old lib's form/types.ts (FE-2941). Off old-lib ButtonProps/
// InputProps → new-lib ButtonVariants; the retired `uiConfig` channel (D-3) is
// dropped; FormControlProps no longer extends InputProps (FormField is chrome,
// not an input — it forwards nothing), keeping only the fields it consumes.

/**
 * The control family's own height scale — `Input`'s, which `Select` shares.
 * Sourced from the exported `InputVariants`, NOT `InputProps`: the ui package's
 * `input/index.ts` never re-exported the latter, so this resolved to `any` and
 * every `size` typed against it accepted anything at all.
 */
export type ControlSize = NonNullable<InputVariants["size"]>;

/**
 * The data a form is handed. Every caller passes a declared domain model
 * (`FieldsModel`, `GatewayData`, …), and a declared interface is not assignable
 * to `Record<string, unknown>` — which made six correct call sites type errors
 * for the crime of having a type. The engine only reads this by path.
 */
// `unknown` is exactly what rejects a declared interface here; `any` accepts one.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormModel = Record<string, any>;

export type FormProps<T extends FormModel = FormModel> = {
  /** data-* attributes (e.g. test ids) forwarded to the form root. */
  dataAttrs?: Record<string, string>;
  as?: string;
  // --- JSON Forms props
  i18n?: JsonFormsI18nState;
  schema?: JsonSchema;
  uischema?: UISchemaElement & Internationalizable;
  validationMode?: ValidationMode;
  ajv?: Ajv;
  additionalErrors?: ErrorObject<string, Record<string, unknown>, unknown>[];
  middleware?: Middleware;
  // --- props
  modelValue?: T;
  additionalRenderers?: JsonFormsRendererRegistryEntry[];
  // ---
  actions?: Record<string, FormActionProps>;
  noActions?: boolean;
  autosave?: boolean;
  readonly?: boolean;
  // ---
  /**
   * The form's height, on the control family's scale — the host stamps it onto
   * every child's options, so it may never name a size the controls cannot
   * render (the old `| string` widening let `xl` through to a height-less field).
   */
  size?: ControlSize;
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
  /**
   * The control's height, on the `Input` family's own scale — the same scale
   * the form's own `size` is held to. Resolved once by `toControlSize` in
   * `renderers/utils.ts`, which every control renderer's `appliedOptions` runs
   * its value through, so a combinator sub-schema and a hostless mount land on
   * the house default rather than the primitive's.
   */
  size?: ControlSize;
  class?: HTMLAttributes["class"];
};

/** One choice a uischema element offers, as the tile/option renderers read it. */
export type FormControlOptionItem = {
  /** Narrower than it looks: reka's AcceptableValue has no boolean. */
  value: string | number;
  label?: string;
  secondaryDescription?: string;
  dataAttrs?: Record<string, string>;
  badge?: {
    label?: string;
    variant?: BadgeVariants["variant"];
    appearance?: BadgeVariants["appearance"];
  };
};

/**
 * What a uischema element's `options` bag may carry THROUGH a renderer to the
 * input primitive underneath it — the author-facing half of a control.
 *
 * Distinct from `FormControlProps`, which is FormField's chrome and forwards
 * nothing: these keys never reach FormField, they reach the `Input`/`Select`
 * the renderer draws. Declaring them is what stops `appliedOptions.placeholder`
 * resolving to `unknown` off the bag's own index signature — the shape that
 * made every renderer's binding a type error while rendering perfectly well.
 *
 * Open by design: an author may add a key a bespoke renderer reads, so the bag
 * keeps its index signature and this names only what the shipped renderers ask
 * for.
 */
export type FormControlOptions = {
  items?: FormControlOptionItem[];
  autocomplete?: string;
  currency?: string;
  mask?: string;
  pattern?: string;
  placeholder?: string;
  readonly?: boolean;
  type?: string;
  // --- bounds, on the value and on the layout
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  minLength?: number;
  /** Columns a choice renderer lays its tiles out in. */
  width?: number;
  // --- affordances
  clearable?: boolean;
  clearLabel?: string;
  /** How many choices a collapsible list shows before it folds. */
  collapse?: number;
  icon?: string;
  iconAppend?: string;
  hint?: string;
  /** Password affordance copy — the primitive requires all three. */
  generate?: string;
  show?: string;
  hide?: string;
  hideRequiredAsterisk?: boolean;
  // --- chrome a renderer forwards to the control it draws
  border?: boolean;
  loading?: boolean;
  /** Per-requirement error copy, keyed by the requirement it answers. */
  error?: Record<string, string>;
  success?: string;
  /** The password rules a control enforces, keyed by rule name. */
  requirements?: Record<string, string>;
  /** The upload target an image control writes into. */
  field?: object;
  /** How a manage control lists its items. */
  as?: string;
  /** A manage control's own config, handed on to the Manage component. */
  manage?: object;
  /** Presentation metadata a bespoke renderer reads. */
  meta?: object;
  uiMeta?: object;
  uiCategoryMeta?: object;
  /** Set by a renderer that has already resolved the value it was handed. */
  overridden?: boolean;
};

type SharedBindingObject<TValue = unknown> = {
  name: string;
  onBlur: (e: Event) => void;
  onInput: (e: Event | unknown) => void;
  onChange: (e: Event | unknown) => void;
  "onUpdate:modelValue"?: ((e: TValue) => unknown) | undefined;
};

export type FieldBindingObject<TValue = unknown> =
  SharedBindingObject<TValue> & {
    value?: TValue;
    checked?: boolean;
  };

export type ComponentFieldBindingObject<TValue = unknown> =
  SharedBindingObject<TValue> & {
    modelValue?: TValue;
  };

export type FormControlRenderProps = {
  uischema: ControlElement;
  schema: NonNullable<JsonSchema>;
  path: string;
  enabled: boolean;
  renderers: JsonFormsRendererRegistryEntry[];
  data: unknown;
  label: string;
  description: string;
  required: boolean;
  visible: boolean;
  config: unknown;
  id: string;
  errors: string | string[];
};
