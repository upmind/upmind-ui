import { computed } from "vue";
import { merge, cloneDeep, defaults, set, isEmpty } from "lodash-es";

import {
  composePaths,
  findUISchema,
  getFirstPrimitiveProp,
  Resolve,
} from "@jsonforms/core";

import type { Tester } from "@jsonforms/core";
import { rankWith } from "@jsonforms/core";
import { debounce, isFunction } from "lodash-es";
import type { FormControlProps } from "../types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------

export const useUpwindRenderer = <
  I extends { control: any; handleChange: Function },
>(
  input: I,
  adaptTarget: (target: any) => any = v => v?.value || v || null
) => {
  const appliedOptions: ComputedRef<FormControlProps> = computed(() =>
    merge(
      {},
      cloneDeep(input.control.value.config),
      cloneDeep(input.control.value.uischema.options)
    )
  );

  const onInput = debounce((value: any) => {
    input.handleChange(input.control.value.path, adaptTarget(value));
  }, 350);

  const formFieldProps = computed(() => {
    const props = defaults(appliedOptions.value, {
      label: input.control.value.label,
      description: input.control.value.description,
      required: input.control.value.required,
      disabled: !input.control.value.enabled,
      visible: input.control.value.visible,
      pristine: isEmpty(input.control.value.data),
    });

    set(props, "id", input.control.value.id);
    set(props, "name", input.control.value.path);
    set(props, "errors", input.control.value.errors);

    return props;
  });

  return {
    ...input,
    appliedOptions,
    formFieldProps,
    onInput,
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

export const useUpwindArrayRenderer = <
  I extends { control: any; addItem?: Function; removeItem?: Function },
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
      pristine: isEmpty(input.control.value.data),
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

  const onInput = debounce((checked: boolean, value: any) => {
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
  }, 350);

  return {
    ...input,
    appliedOptions,
    formFieldProps,
    childUiSchema,
    childLabelForIndex,
    onInput,
  };
};

// -----------------------------------------------------------------------------

export function registerEntry(
  renderer: any,
  { rank, controlType }: { rank: number; controlType: Tester }
) {
  const entry = {
    renderer,
    tester: rankWith(rank, controlType),
  };
  return entry;
}
