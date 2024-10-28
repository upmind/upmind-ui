<template>
  <FormField v-bind="delegatedProps">
    <input type="hidden" :value="control.data" />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useJsonFormsControl } from "@jsonforms/vue";

// --- components
import FormField from "../../FormField.vue";

// --- utils
import { useUpwindRenderer } from "../utils";
import { has, get } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions } = useUpwindRenderer(
  useJsonFormsControl(props)
);

const delegatedProps = computed(() => {
  const options = get(appliedOptions, "options", {});
  return {
    // ---
    label: control.value.label,
    description: control.value.description,
    // ---
    required: control.value.required,
    disabled: !control.value.enabled,
    visible: control.value.visible,
    ...options,
    // --- immutable
    id: control.value.id,
    name: control.value.path,
    errors: control.value.errors,
  };
});
</script>

<script lang="ts">
import { formatIs, uiTypeIs, schemaMatches, and, or } from "@jsonforms/core";
export const tester = {
  rank: 2,
  controlType: and(
    uiTypeIs("Control"),
    or(
      formatIs("hidden"),
      schemaMatches(schema => has(schema, "const"))
    )
  ),
};
</script>
