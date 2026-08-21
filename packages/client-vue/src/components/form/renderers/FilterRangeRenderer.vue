<template>
  <FormField v-bind="formFieldProps" :optional-text="''">
    <div class="flex flex-row flex-nowrap items-center gap-x-3">
      <Input
        width="full"
        :id="`${formFieldProps.id}-from`"
        :type="gteInputType"
        :disabled="!control.enabled"
        :model-value="
          toDisplayValue(
            get(control.data, RequestFilterOperator.GREATER_THAN_OR_EQUAL),
            gteInputType
          )
        "
        @update:modelValue="
          write(RequestFilterOperator.GREATER_THAN_OR_EQUAL, $event)
        "
      />
      <span aria-hidden="true">&ndash;</span>
      <Input
        width="full"
        :id="`${formFieldProps.id}-to`"
        :type="lteInputType"
        :disabled="!control.enabled"
        :model-value="
          toDisplayValue(
            get(control.data, RequestFilterOperator.LESS_THAN_OR_EQUAL),
            lteInputType
          )
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

/** Derive input type for a specific operator from its schema leaf. */
function getInputType(operator: RequestFilterOperator): string {
  const leafSchema = get(control.value.schema, ["properties", operator]);
  const leafType = castArray(get(leafSchema, "type"));
  const leafFormat = get(leafSchema, "format");

  if (!isEmpty(intersection(leafType, ["number", "integer"]))) {
    return "number";
  }
  if (leafFormat === "date-time") {
    return "datetime-local";
  }
  if (leafFormat === "date") {
    return "date";
  }
  return "text";
}

const gteInputType = computed(() =>
  getInputType(RequestFilterOperator.GREATER_THAN_OR_EQUAL)
);
const lteInputType = computed(() =>
  getInputType(RequestFilterOperator.LESS_THAN_OR_EQUAL)
);

/** Convert ISO 8601 string to input-compatible format for display. */
function toDisplayValue(
  isoValue: string | null | undefined,
  inputType: string
): string {
  if (!isoValue) return "";
  if (inputType === "datetime-local") {
    const date = new Date(isoValue);
    if (isNaN(date.getTime())) return isoValue;
    return date.toISOString().slice(0, 16);
  }
  if (inputType === "date") {
    const date = new Date(isoValue);
    if (isNaN(date.getTime())) return isoValue;
    return date.toISOString().slice(0, 10);
  }
  return isoValue;
}

// --- methods

/**
 * Sets or clears ONE end, merged onto the column's current value so the
 * untouched end survives. An emptied box carries no text, which is the end's
 * unset member.
 */
function write(operator: RequestFilterOperator, value?: string | number): void {
  const isUnset = isNil(value) || value === "";
  const inputType = getInputType(operator);

  let finalValue: string | number | null = null;
  if (!isUnset && typeof value === "string") {
    if (inputType === "datetime-local") {
      finalValue = new Date(value).toISOString();
    } else if (inputType === "date") {
      finalValue = `${value}T00:00:00Z`;
    } else {
      finalValue = value;
    }
  } else if (!isUnset) {
    finalValue = value as number;
  }

  handleChange(
    control.value.path,
    assign({}, control.value.data, { [operator]: finalValue })
  );
}
</script>

<script lang="ts">
export const tester = {
  rank: 3,
  controlType: and(isObjectControl, optionIs("format", "range"))
};
</script>
