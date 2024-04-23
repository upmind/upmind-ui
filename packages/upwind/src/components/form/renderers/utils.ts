import { computed, ref } from "vue";
import { merge, cloneDeep, isNil } from "lodash-es";

import {
  composePaths,
  findUISchema,
  getFirstPrimitiveProp,
  Resolve,
} from "@jsonforms/core";

import type { JsonFormsRendererRegistryEntry, Tester } from "@jsonforms/core";
import { rankWith } from "@jsonforms/core";

// -----------------------------------------------------------------------------

export const useUpwindRenderer = <
  I extends { control: any; handleChange: any },
>(
  input: I,
  adaptTarget: (target: any) => any = v => v.value
) => {
  const appliedOptions = computed(() =>
    merge(
      {},
      cloneDeep(input.control.value.config),
      cloneDeep(input.control.value.uischema.options)
    )
  );

  const isFocused = ref(false);

  const onChange = (event: Event) => {
    input.handleChange(
      input.control.value.path,
      adaptTarget(event.currentTarget)
    );
  };

  const controlWrapper = computed(() => {
    const { id, description, errors, label, visible, required, enabled, data } =
      input.control.value;
    return {
      id: `${id}-input`,
      description,
      errors,
      label,
      dirty: !isNil(data),
      focused: isFocused.value,
      disabled: !enabled,
      visible,
      required,
      // add our ApplyOptions to the controlWrapper
      ...appliedOptions.value,
    };
  });

  return {
    ...input,
    isFocused,
    appliedOptions,
    controlWrapper,
    onChange,
  };
};

export const useUpwindLayoutRenderer = <I extends { layout: any }>(
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
    appliedOptions,
  };
};

export const useUpwindLabelRenderer = <I extends { label: any }>(input: I) => {
  const appliedOptions = computed(() =>
    merge(
      {},
      cloneDeep(input.label.value.config),
      cloneDeep(input.label.value.uischema.options)
    )
  );
  return {
    ...input,
    appliedOptions,
  };
};

export const useUpwindArrayRenderer = <I extends { control: any }>(
  input: I
) => {
  const appliedOptions = computed(() =>
    merge(
      {},
      cloneDeep(input.control.value.config),
      cloneDeep(input.control.value.uischema.options)
    )
  );

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

  const isFocused = ref(false);

  const controlWrapper = computed(() => {
    const { id, description, errors, label, visible, required, enabled, data } =
      input.control.value;
    return {
      id: `${id}-input`,
      description,
      errors,
      label,
      dirty: !isNil(data),
      focused: isFocused.value,
      disabled: !enabled,
      visible,
      required,
      // add our ApplyOptions to the controlWrapper
      ...appliedOptions.value,
    };
  });

  return {
    ...input,
    appliedOptions,
    controlWrapper,
    childUiSchema,
    childLabelForIndex,
  };
};

// -----------------------------------------------------------------------------

export function registerEntry(
  renderer: any,
  { rank, controlType }: { rank: number; controlType: Tester }
) {
  const entry: JsonFormsRendererRegistryEntry = {
    renderer,
    tester: rankWith(rank, controlType),
  };
  return entry;
}
