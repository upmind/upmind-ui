<template>
  <FormField v-bind="formFieldProps">
    <input type="hidden" :value="control.data" />
  </FormField>
</template>

<script lang="ts" setup>
import { formatIs, uiTypeIs, schemaMatches, and, or } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import FormField from "../../FormField.vue";
import { useUpmindUIRenderer } from "../utils";
import { has } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps } = useUpmindUIRenderer(
  useJsonFormsControl(props)
);
</script>

<script lang="ts">
export const tester = {
  rank: 2,
  controlType: and(
    uiTypeIs("Control"),
    or(
      formatIs("hidden"),
      schemaMatches(schema => has(schema, "const"))
    )
  )
};
</script>
