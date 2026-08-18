<template>
  <FormField v-bind="formFieldProps" :optional-text="''">
    <div class="flex flex-row flex-nowrap items-center gap-x-3">
      <Input
        :id="`${formFieldProps.id}-from`"
        :type="inputType"
        :disabled="!control.enabled"
        :model-value="
          get(control.data, RequestFilterOperator.GREATER_THAN_OR_EQUAL)
        "
        @update:modelValue="
          write(RequestFilterOperator.GREATER_THAN_OR_EQUAL, $event)
        "
      />
      <span aria-hidden="true">&ndash;</span>
      <Input
        :id="`${formFieldProps.id}-to`"
        :type="inputType"
        :disabled="!control.enabled"
        :model-value="
          get(control.data, RequestFilterOperator.LESS_THAN_OR_EQUAL)
        "
        @update:modelValue="
          write(RequestFilterOperator.LESS_THAN_OR_EQUAL, $event)
        "
      />
    </div>
  </FormField>
</template>

<script lang="ts" setup>
import { and, isObjectControl, optionIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { computed } from "vue";
import { RequestFilterOperator } from "@upmind-automation/headless";
import {
  FormField,
  Input,
  useUpmindUIRenderer
} from "@upmind-automation/upmind-ui";
import {
  assign,
  castArray,
  get,
  intersection,
  isEmpty,
  isNil
} from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
/**
 * @module form/renderers/FilterRangeRenderer
 * @description A two-ended filter column as a pair of bounded inputs. The ONE
 * renderer of the family that scopes the COLUMN rather than a leaf: a range is
 * two leaves (`gte`/`lte`) and a single Control can scope only one, so this one
 * owns the operator vocabulary the others get for free from their scope.
 *
 * A filter is optional by definition, so the field suppresses the indicator that
 * says so — the treatments that draw no label suppress it by drawing none.
 */

const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, handleChange } = useUpmindUIRenderer(
  useJsonFormsControl(props)
);

/**
 * `number` rather than `text` when the column's own bounds are numeric, so the
 * input casts what it emits to the leaf's declared type.
 */
const inputType = computed(() =>
  isEmpty(
    intersection(
      castArray(
        get(control.value.schema, [
          "properties",
          RequestFilterOperator.GREATER_THAN_OR_EQUAL,
          "type"
        ])
      ),
      ["number", "integer"]
    )
  )
    ? "text"
    : "number"
);

// --- methods

/**
 * Sets or clears ONE end, merged onto the column's current value so the
 * untouched end survives. An emptied box carries no text, which is the end's
 * unset member.
 */
function write(operator: RequestFilterOperator, value?: string | number): void {
  // An emptied box carries no text; `isEmpty` cannot say so here, since it calls
  // every number empty and `0` is a legitimate bound.
  const isUnset = isNil(value) || value === "";

  // `handleChange`, not the renderer's `onInput`: a cleared end writes `null`,
  // which `onInput` drops as "not dirty".
  handleChange(
    control.value.path,
    assign({}, control.value.data, { [operator]: isUnset ? null : value })
  );
}
</script>

<script lang="ts">
export const tester = {
  rank: 3,
  controlType: and(isObjectControl, optionIs("format", "range"))
};
</script>
