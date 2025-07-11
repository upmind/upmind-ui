<template>
  <FormField v-bind="formFieldProps">
    <Billing
      :model-value="control.data"
      :touched="formFieldProps.touched"
      @update:modelValue="onInput"
      @update:type="resetInput"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { useJsonFormsControl } from "@jsonforms/vue";

// --- components
import { FormField } from "@upmind-automation/upmind-ui";
import Billing from "../../../modules/billing/Billing.vue";

// --- utils
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, onInput } = useUpmindUIRenderer(
  useJsonFormsControl(props)
);

const resetInput = (value: string) => {
  onInput(value, false);
};
</script>

<script lang="ts">
import { uiTypeIs, and } from "@jsonforms/core";

export const tester = {
  rank: 3,
  controlType: and(uiTypeIs("ControlBilling"))
};
</script>
