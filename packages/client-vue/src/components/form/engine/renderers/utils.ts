import {
  composePaths,
  createCombinatorRenderInfos,
  findUISchema,
  getErrorAt,
  getFirstPrimitiveProp,
  getSubErrorsAt,
  rankWith,
  Resolve
} from "@jsonforms/core";
import { computed, ref, inject, watch } from "vue";
import {
  cloneDeep,
  defaults,
  isEmpty,
  get,
  includes,
  isEqual,
  isFunction,
  isNil,
  isNull,
  kebabCase,
  map,
  merge,
  omit,
  reduce,
  set
} from "lodash-es";
import type {
  ControlSize,
  FormControlOptions,
  FormControlProps
} from "../types";
import type {
  Tester,
  JsonFormsUISchemaRegistryEntry,
  JsonFormsSubStates,
  CombinatorSubSchemaRenderInfo,
  IterateCallback,
  StatePropsOfArrayControl,
  StatePropsOfControl,
  StatePropsOfLabel,
  StatePropsOfLayout,
  UISchemaElement
} from "@jsonforms/core";
import type { ErrorObject } from "ajv";
// -----------------------------------------------------------------------------

/**
 * The control family's own scale — `Input` / `Select` / `Textarea` all carry
 * exactly these, and `FormProps["size"]` is now held to the same three, so the
 * host can no longer stamp a size the controls cannot render. This coercion
 * remains the guard for uischema-authored sizes, which are untyped.
 *
 * `lg` is the house default, matching `FormHost`'s own. Every control renderer
 * resolves its size here, so a combinator/`oneOf` sub-schema and a hostless
 * mount — neither of which the host ever stamps — land on the same scale as a
 * hosted field rather than silently dropping to the primitive's `md`.
 */
const CONTROL_SIZES: ControlSize[] = ["sm", "md", "lg"];

const DEFAULT_CONTROL_SIZE: ControlSize = "lg";

export function toControlSize(size?: unknown): ControlSize {
  return includes(CONTROL_SIZES, size as ControlSize)
    ? (size as ControlSize)
    : DEFAULT_CONTROL_SIZE;
}
// -----------------------------------------------------------------------------

/**
 * Converts a JSON Schema scope path into a CSS/HTML-safe element ID.
 * JSON Forms generates control IDs from the uischema scope (e.g.
 * `#/properties/provisionFields/properties/create_hostname`) which contain
 * `#` and `/` — invalid in CSS selectors and problematic as HTML IDs.
 *
 * @example
 * toSafeControlId("#/properties/term") // "properties-term"
 * toSafeControlId("#/properties/provisionFields/properties/create_hostname")
 * // "properties-provision-fields-properties-create-hostname"
 */
export function toSafeControlId(scope: string): string {
  return kebabCase(scope);
}

/**
 * What `useJsonFormsControl` actually hands a renderer. JSONForms' own
 * `StatePropsOfControl` omits two fields its mappers put on the object:
 * `initial` (the value the form booted with, which is how dirty is decided) and
 * `uischemas` (the registry `findUISchema` needs to resolve a detail schema).
 * Both are read below, so both are named here rather than asserted away at each
 * call site.
 */
type EngineControlState = StatePropsOfControl & {
  initial?: unknown;
  uischemas?: JsonFormsUISchemaRegistryEntry[];
};

type EngineArrayControlState = StatePropsOfArrayControl & {
  initial?: unknown;
  uischemas?: JsonFormsUISchemaRegistryEntry[];
};

export const useUpmindUIRenderer = <
  I extends {
    control: { value: EngineControlState };
    handleChange: (path: string, value: unknown) => void;
  }
>(
  input: I,
  adaptTarget: (target: unknown) => unknown = v =>
    (v as { value?: unknown })?.value || v || null
) => {
  const jsonforms = inject<JsonFormsSubStates>("jsonforms");
  if (!jsonforms) throw new Error("jsonforms not found");

  function getErrors() {
    if (!jsonforms?.core) return [];

    const errors = getErrorAt(
      input.control.value.path,
      input.control.value.rootSchema
    )({
      jsonforms: {
        ...jsonforms,
        core: { ...jsonforms.core, validationMode: "ValidateAndShow" } //NB force validation mode so we always get all errors
      }
    });

    if (
      input.control.value.schema.type == "object" &&
      !isEmpty(input.control.value.schema?.properties)
    ) {
      const resolvedSchema = Resolve.schema(
        input.control.value.schema,
        "properties",
        input.control.value.rootSchema
      );

      const childErrors = getSubErrorsAt(
        input.control.value.path,
        resolvedSchema
      )({ jsonforms });

      if (!isEmpty(childErrors))
        errors.push({
          instancePath: input.control.value.path,
          schema: resolvedSchema,
          message: `${input.control.value.label} is required`,
          keyword: "object",
          schemaPath: input.control.value.path,
          params: {},
          dataPath: input.control.value.path
        } as ErrorObject);
    }

    return map(errors, error => {
      const translated =
        isFunction(jsonforms.i18n?.translateError) &&
        isFunction(jsonforms.i18n?.translate)
          ? jsonforms.i18n.translateError(
              error,
              jsonforms.i18n.translate,
              // NB we need tp provide the translated label as title for better error messages
              //    we also provide the path so that we can use it in the i18n key if needed
              //    these props are not part of the schema but we add them here for convenience
              {
                ...input.control.value.schema,
                path: input.control.value.path,
                title:
                  input.control.value.label ?? input.control.value.schema.title,
                i18n: input.control.value.uischema?.i18n || undefined // NB pass any i18n key in case we need to use the specific key for error messages
              } as unknown as UISchemaElement
            )
          : undefined;

      error.message = translated ?? error.message;
      return error;
    });
  }

  // --- state

  const errors = ref(getErrors());

  const touched = ref<boolean>(
    jsonforms?.core?.validationMode == "ValidateAndShow"
  );

  const appliedOptions = computed(
    (): Partial<FormControlProps> &
      FormControlOptions &
      Record<string, unknown> => {
      const options = merge(
        {},
        cloneDeep(input.control.value.config),
        cloneDeep(input.control.value.uischema.options)
      );

      return { ...options, size: toControlSize(options.size) };
    }
  );

  // let's get our errors as full error objects
  watch(input.control, _control => {
    touched.value =
      touched.value || jsonforms?.core?.validationMode === "ValidateAndShow";
    errors.value = getErrors();
  });

  const onInput = (value: unknown, isTouched: boolean = true) => {
    if (isNil(value)) return; // NB values that are not set cannot be dirty
    input.handleChange(input.control.value.path, adaptTarget(value));
    touched.value = isTouched;
  };

  /**
   * Take the value OFF the model. `onInput` nil-drops by design (a value that
   * was never set cannot be dirty), so a clear affordance routed through it is
   * dead on arrival — this is the door that answers one.
   */
  const onClear = () => {
    input.handleChange(input.control.value.path, undefined);
    touched.value = true;
  };

  /**
   * The host's own translator, for copy the RENDERER owns rather than the
   * schema — a control's affordance has no uischema element to carry an `i18n`
   * key of its own, and an untranslated default would ship English from inside
   * the library.
   */
  const translate = (key: string, fallback: string): string =>
    isFunction(jsonforms.i18n?.translate)
      ? ((jsonforms.i18n.translate(key, fallback, {}) as string) ?? fallback)
      : fallback;

  // Declared as what FormField CONSUMES. The bag it is built from is open
  // (uischema options are author-authored), and an index signature of `unknown`
  // makes every `v-bind` of it a type error at the call site while binding
  // perfectly well at runtime — so the chrome contract is stated here, once.
  const formFieldProps = computed((): FormControlProps => {
    // `defaults` only fills what is UNDEFINED, and a catalogue entry files the
    // copy it does not carry as an explicit `null` — so a null label would win
    // over the one JSON Forms derived and the field would render nameless.
    // Suppression is the `noLabel` option's job; absent copy is just absent.
    const offered = isNull(appliedOptions.value.label)
      ? omit(appliedOptions.value, ["label"])
      : appliedOptions.value;

    const props = defaults(offered, {
      label: input.control.value.label,
      description: input.control.value.description,
      required: input.control.value.required,
      disabled: !input.control.value.enabled,
      visible: input.control.value.visible,
      optionalText: appliedOptions.value?.optionalText,
      requiredText: appliedOptions.value?.requiredText
    });

    set(props, "id", toSafeControlId(input.control.value?.id ?? ""));
    set(props, "name", input.control.value.path);
    set(props, "errors", map(errors.value, "message"));
    set(
      props,
      "dirty",
      !isEqual(
        input.control.value.data || null,
        input.control.value.initial || null
      )
    );

    set(props, "touched", touched.value);

    // The bag also carries the CONTROL options (placeholder, mask, …), which
    // FormField ignores and the renderer reads separately off appliedOptions.
    return props as FormControlProps;
  });

  // The suite addresses a control by its own key AND the control's id, on the
  // same element. FormField carries the id, so the control has to carry it as
  // its test value — the retired Input derived this from its `id` prop, and the
  // replacement emits no value at all.
  const controlDataAttrs = computed(() => ({
    "data-test-value": toSafeControlId(input.control.value?.id ?? "")
  }));

  return {
    ...input,
    errors,
    appliedOptions,
    formFieldProps,
    controlDataAttrs,
    onInput,
    onClear,
    translate,
    // Exposed for the renderers that write through `handleChange` rather than
    // `onInput` — they still owe the touched flag their own control's errors
    // are gated on.
    touched
  };
};

export const useUpmindUILayoutRenderer = <
  I extends { layout: { value: StatePropsOfLayout } }
>(
  input: I
) => {
  const appliedOptions = computed(() =>
    merge(
      {},
      cloneDeep(input.layout.value.config),
      cloneDeep(input.layout.value.uischema.options)
    )
  );
  return {
    ...input,
    appliedOptions
  };
};

export const useUpmindUILabelRenderer = <
  I extends { label: { value: StatePropsOfLabel } }
>(
  input: I
) => {
  const appliedOptions = computed(() =>
    merge(
      {},
      cloneDeep(input.label.value.config),
      cloneDeep(input.label.value.uischema.options)
    )
  );
  return {
    ...input,
    appliedOptions
  };
};

export const useUpmindUIArrayRenderer = <
  I extends {
    control: { value: EngineArrayControlState };
    addItem?: (path: string, value: unknown) => () => void;
    removeItem?: (path: string, index: number) => () => void;
  }
>(
  input: I
) => {
  const appliedOptions = computed(() =>
    merge(
      {},
      cloneDeep(input.control.value.config),
      cloneDeep(input.control.value.uischema.options)
    )
  );

  // Declared as what FormField CONSUMES. The bag it is built from is open
  // (uischema options are author-authored), and an index signature of `unknown`
  // makes every `v-bind` of it a type error at the call site while binding
  // perfectly well at runtime — so the chrome contract is stated here, once.
  const formFieldProps = computed((): FormControlProps => {
    const props = defaults(appliedOptions.value, {
      label: input.control.value.label,
      description: input.control.value.description,
      required: input.control.value.required,
      disabled: !input.control.value.enabled,
      visible: input.control.value.visible,
      dirty: !isEqual(input.control.value.data, input.control.value.initial)
    });

    set(props, "id", toSafeControlId(input.control.value.id ?? ""));
    set(props, "name", input.control.value.path);
    set(props, "errors", input.control.value.errors);

    return props;
  });

  const childUiSchema = computed(() =>
    findUISchema(
      input.control.value.uischemas ?? [],
      input.control.value.schema,
      input.control.value.uischema.scope,
      input.control.value.path,
      undefined,
      input.control.value.uischema,
      input.control.value.rootSchema
    )
  );

  const childLabelForIndex = (index: number) => {
    const childLabelProp =
      input.control.value.uischema.options?.childLabelProp ??
      getFirstPrimitiveProp(input.control.value.schema);
    if (!childLabelProp) {
      return `${index}`;
    }
    const labelValue = Resolve.data(
      input.control.value.data,
      composePaths(`${index}`, childLabelProp)
    );
    if (labelValue === undefined || labelValue === null || isNaN(labelValue)) {
      return "";
    }
    return `${labelValue}`;
  };

  const onInput = (checked: boolean, value: unknown) => {
    if (checked) {
      if (isFunction(input?.addItem)) {
        input.addItem(input.control.value.path, value);
      } else {
        //
      }
    } else {
      if (isFunction(input?.removeItem)) {
        input?.removeItem(input.control.value.path, Number(value));
      } else {
        //
      }
    }
  };

  return {
    ...input,
    appliedOptions,
    formFieldProps,
    childUiSchema,
    childLabelForIndex,
    onInput
  };
};

/**
 * Creates indexed render information for oneOf schemas
 */
export const createIndexedOneOfRenderInfos = (
  control: EngineControlState
): (CombinatorSubSchemaRenderInfo & {
  index: number;
})[] => {
  const oneOfUiSchemas = control.uischema.options?.oneOfUiSchema;

  const result = createCombinatorRenderInfos(
    control.schema.oneOf!,
    control.rootSchema,
    "oneOf",
    control.uischema,
    control.path,
    control.uischemas ?? []
  );

  return reduce(
    result,
    (acc, info, index) => {
      if (!info.uischema) return acc;

      acc.push(
        oneOfUiSchemas && oneOfUiSchemas[index]
          ? { ...info, uischema: oneOfUiSchemas[index], index }
          : { ...info, index }
      );
      return acc;
    },
    [] as (CombinatorSubSchemaRenderInfo & { index: number })[]
  );
};
// -----------------------------------------------------------------------------

export function registerEntry(
  renderer: unknown,
  { rank, controlType }: { rank: number; controlType: Tester }
) {
  const entry = {
    renderer,
    tester: rankWith(rank, controlType)
  };
  return entry;
}

/**
 * Walk a uischema and apply a callback to every LEAF it reaches.
 *
 * JSONForms core exports no such walker, so there is nothing here to be "more
 * comprehensive" than — what this owns is two rules core's own layout handling
 * does not give us: a node is a layout because it carries `elements`, not
 * because it holds one of the three names core knows (our own `FilterBar` would
 * otherwise be applied whole and its children never reached), and a control's
 * `options.detail` sub-tree is walked as well, so a nested form's own controls
 * are stamped like any other.
 *
 * A node carrying `elements` is recursed into and NOT itself applied: a layout
 * has no control options to carry.
 *
 * @param uischema The UISchema element to iterate over.
 * @param toApply The callback function to apply to each element.
 * @returns void
 */
export const iterateSchema = (
  uischema: UISchemaElement,
  toApply: IterateCallback
): void => {
  if (isEmpty(uischema)) return;

  // Any node carrying `elements` is a layout here, not just the three JSONForms
  // names — our own (`FilterBar`) would otherwise swallow its children whole.
  const elements = get(uischema, "elements") as UISchemaElement[] | undefined;

  if (!isEmpty(elements)) {
    elements!.forEach(child => iterateSchema(child, toApply));
    return;
  }

  if (uischema?.options?.detail?.elements) {
    uischema.options.detail.elements.forEach((child: UISchemaElement) =>
      iterateSchema(child, toApply)
    );
  }
  toApply(uischema);
};
