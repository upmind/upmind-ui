import { computed, ref } from "vue";
import { merge, cloneDeep, defaults, set, isEqual } from "lodash-es";

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
import type { ComputedRef, Ref } from "vue";
// -----------------------------------------------------------------------------

export const useUpmindUIRenderer = <
  I extends { control: any; handleChange: Function },
>(
  input: I,
  adaptTarget: (target: any) => any = v => v?.value || v || null
) => {
  const touched: Ref<boolean> = ref(false);

  const appliedOptions: ComputedRef<FormControlProps> = computed(() => {
    return merge(
      {},
      cloneDeep(input.control.value.config),
      cloneDeep(input.control.value.uischema.options)
    );
  });

  const onInput = (value: any) => {
    touched.value = true;
    input.handleChange(input.control.value.path, adaptTarget(value));
  };

  const formFieldProps = computed(() => {
    const props = defaults(appliedOptions.value, {
      label: input.control.value.label,
      description: input.control.value.description,
      required: input.control.value.required,
      disabled: !input.control.value.enabled,
      visible: input.control.value.visible,
    });

    set(props, "id", input.control.value.id);
    set(props, "name", input.control.value.path);
    set(props, "errors", input.control.value.errors);
    set(
      props,
      "dirty",
      !isEqual(
        input.control.value.data || null,
        input.control.value.initial || null
      )
    );
    set(
      props,
      "touched",
      input.control.value.uischema.options?.touched || touched.value
    );
    return props;
  });

  return {
    ...input,
    appliedOptions,
    formFieldProps,
    onInput,
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
    appliedOptions,
  };
};

export const useUpmindUILabelRenderer = <I extends { label: any }>(input: I) => {
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

export const useUpmindUIArrayRenderer = <
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
      dirty: !isEqual(input.control.value.data, input.control.value.initial),
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
