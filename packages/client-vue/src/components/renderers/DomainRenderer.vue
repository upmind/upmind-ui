<template>
  <FormField v-bind="delegatedProps">
    <Domain :model-value="control.data" @update:modelValue="onInput" />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useJsonFormsControl } from "@jsonforms/vue";

// --- components
import { FormField } from "@upmind/upwind";
import Domain from "../domain/Domain.vue";

// --- utils
import { useUpwindRenderer } from "@upmind/upwind";
import { defaults, set } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";

// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, onInput } = useUpwindRenderer(
  useJsonFormsControl(props)
);

const delegatedProps = computed(() => {
  const options = defaults(
    appliedOptions.value || {
      label: control.value.label,
      description: control.value.description,
      required: control.value.required,
      disabled: !control.value.enabled,
      visible: control.value.visible,
    }
  );

  set(options, "id", control.value.id);
  set(options, "name", control.value.path);
  set(options, "errors", control.value.errors);

  return options;
});
</script>

<script lang="ts">
import { uiTypeIs, formatIs, and } from "@jsonforms/core";
export const tester = {
  rank: 3,
  controlType: and(uiTypeIs("Control"), formatIs("domain_name")),
};
</script>
