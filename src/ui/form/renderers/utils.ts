// --- external
import { computed, ref, inject, watch } from "vue";
import {
  composePaths,
  createCombinatorRenderInfos,
  findUISchema,
  getErrorAt,
  getFirstPrimitiveProp,
  getSubErrorsAt,
  isLayout,
  rankWith,
  Resolve
} from "@jsonforms/core";

// --- utils
import {
  cloneDeep,
  defaults,
  isEmpty,
  isEqual,
  isFunction,
  map,
  merge,
  set
} from "lodash-es";

// --- types
import type {
  Tester,
  JsonFormsSubStates,
  CombinatorSubSchemaRenderInfo,
  IterateCallback,
  UISchemaElement
} from "@jsonforms/core";
import type { ErrorObject } from "ajv";
import type { FormControlProps } from "../types";
// -----------------------------------------------------------------------------

export const useUpmindUIRenderer = <
  I extends { control: any; handleChange: Function }
>(
  input: I,
  adaptTarget: (target: any) => any = v => v?.value || v || null
) => {
  const jsonforms = inject<JsonFormsSubStates>("jsonforms");
  if (!jsonforms) throw new Error("jsonforms not found");

  // --- utils
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
              }
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

  const appliedOptions = computed((): Partial<FormControlProps> | any => {
    return merge(
      {},
      cloneDeep(input.control.value.config),
      cloneDeep(input.control.value.uischema.options)
    );
  });

  // let's get our errors as full error objects
  watch(input.control, _control => {
    touched.value =
      touched.value || jsonforms?.core?.validationMode === "ValidateAndShow";

    errors.value = getErrors();
  });

  const onInput = (value: any, isTouched: boolean = true) => {
    input.handleChange(input.control.value.path, adaptTarget(value));
    touched.value = isTouched;
  };

  const formFieldProps = computed(() => {
    const props = defaults(appliedOptions.value, {
      label: input.control.value.label,
      description: input.control.value.description,
      required: input.control.value.required,
      disabled: !input.control.value.enabled,
      visible: input.control.value.visible,
      optionalText: appliedOptions.value?.optionalText,
      requiredText: appliedOptions.value?.requiredText
    });

    set(props, "id", input.control.value?.id);
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

    return props;
  });

  return {
    ...input,
    errors,
    appliedOptions,
    formFieldProps,
    onInput
  };
};

export const useUpmindUILayoutRenderer = <I extends { layout: any }>(
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

export const useUpmindUILabelRenderer = <I extends { label: any }>(
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
  I extends { control: any; addItem?: Function; removeItem?: Function }
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

  const formFieldProps = computed(() => {
    const props = defaults(appliedOptions.value, {
      label: input.control.value.label,
      description: input.control.value.description,
      required: input.control.value.required,
      disabled: !input.control.value.enabled,
      visible: input.control.value.visible,
      dirty: !isEqual(input.control.value.data, input.control.value.initial)
    });

    set(props, "id", input.control.value.id);
    set(props, "name", input.control.value.path);
    set(props, "errors", input.control.value.errors);

    return props;
  });

  const childUiSchema = computed(() =>
    findUISchema(
      input.control.value.uischemas,
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

  const onInput = (checked: boolean, value: any) => {
    if (checked) {
      if (isFunction(input?.addItem)) {
        input.addItem(input.control.value.path, value);
      } else {
        //
      }
    } else {
      if (isFunction(input?.removeItem)) {
        input?.removeItem(input.control.value.path, value);
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
  control: any
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
    control.uischemas
  );

  return result
    .filter(info => info.uischema)
    .map((info, index) => {
      if (oneOfUiSchemas && oneOfUiSchemas[index]) {
        return {
          ...info,
          uischema: oneOfUiSchemas[index],
          index: index
        };
      }
      return { ...info, index: index };
    });
};

// -----------------------------------------------------------------------------

export function registerEntry(
  renderer: any,
  { rank, controlType }: { rank: number; controlType: Tester }
) {
  const entry = {
    renderer,
    tester: rankWith(rank, controlType)
  };
  return entry;
}

/**
 * Iterates over the UISchema elements and applies a callback function.
 * A more comprehensive implementation than in JsonForms core, as it also
 * iterates over detail elements and not just layout elements.
 * @param uischema The UISchema element to iterate over.
 * @param toApply The callback function to apply to each element.
 * @returns void
 */
export const iterateSchema = (
  uischema: UISchemaElement,
  toApply: IterateCallback
): void => {
  if (isEmpty(uischema)) return;

  if (isLayout(uischema)) {
    uischema.elements.forEach(child => iterateSchema(child, toApply));
    return;
  }

  if (uischema?.options?.detail?.elements) {
    uischema.options.detail.elements.forEach((child: UISchemaElement) =>
      iterateSchema(child, toApply)
    );
  }
  toApply(uischema);
};
