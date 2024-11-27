<template>
  <FormField v-bind="formFieldProps" :dirty="!isEmpty(control.data)">
    <Domain :model-value="control.data" @update:modelValue="onInput" />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { useJsonFormsControl } from "@jsonforms/vue";

// --- components
import { FormField } from "@upmind-automation/upwind";
import Domain from "../domain/Domain.vue";

// --- utils
import { useUpwindRenderer } from "@upmind-automation/upwind";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";

// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, onInput } = useUpwindRenderer(
  useJsonFormsControl(props)
);
</script>

<script lang="ts">
import { uiTypeIs, formatIs, and } from "@jsonforms/core";
import { isEmpty } from "lodash-es";
export const tester = {
  rank: 3,
  controlType: and(uiTypeIs("Control"), formatIs("domain_name")),
};
</script>
