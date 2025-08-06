// --- external
import { computed, ref, inject, watch } from "vue";
import {
  Resolve,
  composePaths,
  createCombinatorRenderInfos,
  findUISchema,
  getErrorAt,
  getSubErrorsAt,
  getFirstPrimitiveProp,
  rankWith
} from "@jsonforms/core";

// --- utils
import {
  merge,
  cloneDeep,
  defaults,
  set,
  isEqual,
  map,
  isFunction,
  isEmpty,
  isObject
} from "lodash-es";

// --- types
import type {
  JsonFormsSubStates,
  Tester,
  CombinatorSubSchemaRenderInfo,
  JsonSchema
} from "@jsonforms/core";
import type { FormControlProps } from "../types";
import type { ErrorObject } from "ajv";
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
      isObject(input.control.value.schema.type) ||
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

    return errors;
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

  // lets get our errors as full error objects
  watch(input.control, control => {
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
      visible: input.control.value.visible
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
