<template>
  <FormField v-bind="formFieldProps">
    <Select
      :placeholder="appliedOptions?.placeholder"
      :model-value="control.data?.toString()"
      v-bind="{ items }"
      @update:modelValue="onInput"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { useJsonFormsEnumControl } from "@jsonforms/vue";
// --- components
import FormField from "../../FormField.vue";
import { Select } from "../../../select";

// --- utils
import { useUpmindUIRenderer } from "../utils";

// --- types
import type { ControlElement, EnumOption, JsonSchema } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, appliedOptions, onInput } =
  useUpmindUIRenderer(useJsonFormsEnumControl(props));

/**
 * Computes the list of enum options to be used in the control.
 * The priority for retrieving the options is as follows:
 * 1. `schema.options` if available,
 * 2. otherwise `options` from the control value,
 * 3. or an empty array if none are defined.
 *
 * @remarks
 * This computed property ensures that the most specific set of options is used,
 * allowing for overrides at the schema level.
 *
 * @returns {EnumOption[]} The resolved array of enum options.
 */
const items = computed(() => {
  const { options, schema } = control.value as {
    options: EnumOption[];
    schema: JsonSchema & { options?: EnumOption[] };
  };
  return schema.options || options || [];
});
</script>

<script lang="ts">
import { isEnumControl } from "@jsonforms/core";
import { computed } from "vue";
export const tester = { rank: 2, controlType: isEnumControl };
</script>
