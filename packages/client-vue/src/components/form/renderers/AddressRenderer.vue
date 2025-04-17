<template>
  <FormField v-bind="formFieldProps"> Address Renderer </FormField>
</template>

<script lang="ts" setup>
// --- external
import { useJsonFormsControl } from "@jsonforms/vue";

// --- components
import { FormField } from "@upmind-automation/upmind-ui";

// --- utils
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";

// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const { formFieldProps } = useUpmindUIRenderer(useJsonFormsControl(props));
</script>

<script lang="ts">
import { isStringControl, formatIs, and } from "@jsonforms/core";
export const tester = {
  rank: 3,
  controlType: and(isStringControl, formatIs("address")),
};
</script>
