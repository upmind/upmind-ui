<template>
  <FormField v-bind="fieldProps">
    <Input
      size="lg"
      v-bind="appliedOptions"
      :suffix="description"
      :model-value="control.data"
      :class="appliedOptions?.class"
      @update:model-value="onInput"
    />
  </FormField>
</template>

<script lang="ts" setup>
import { isStringControl, formatIs, and } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { computed } from "vue";
import { Input } from "@upmind/ui";
import FormField from "../engine/FormField.vue";
import { useUpmindUIRenderer } from "../engine/renderers/utils";
import { omit } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// --- external

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props));

const fieldProps = computed(() => {
  return omit(formFieldProps.value, "description") as any;
});

const description = computed(() => {
  return formFieldProps.value.description;
});
</script>

<script lang="ts">
export const tester = {
  rank: 3,
  controlType: and(isStringControl, formatIs("sld"))
};
</script>
