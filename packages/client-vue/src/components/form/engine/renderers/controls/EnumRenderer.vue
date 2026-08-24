<template>
  <FormField v-bind="formFieldProps">
    <Select
      :model-value="control.data?.toString()"
      :items="items"
      :placeholder="appliedOptions?.placeholder"
      size="lg"
      class="w-full"
      @update:model-value="onInput"
    />
  </FormField>
</template>

<script lang="ts" setup>
import { isEnumControl } from "@jsonforms/core";
import { useJsonFormsEnumControl } from "@jsonforms/vue";
import { computed } from "vue";
import { Select } from "@upmind/ui";
import FormField from "../../FormField.vue";
import { useUpmindUIRenderer } from "../utils";
import type { ControlElement, EnumOption, JsonSchema } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, appliedOptions, onInput } =
  useUpmindUIRenderer(useJsonFormsEnumControl(props));

/**
 * The enum options, schema-level overrides first, then the control's, else none.
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
export const tester = { rank: 2, controlType: isEnumControl };
</script>
