<template>
  <FormField v-bind="formFieldProps">
    <Domain
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
import Domain from "../../../modules/domain/Domain.vue";

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

const resetInput = (value?: string) => {
  onInput(value, false);
};
</script>

<script lang="ts">
import { uiTypeIs, and, optionIs, or, schemaMatches } from "@jsonforms/core";
import { includes } from "lodash-es";

export const tester = {
  rank: 3,
  controlType: and(
    uiTypeIs("Control"),
    or(
      optionIs("semantic_type", "domain_name"),
      optionIs("semantic_type", "domain-name"),
      schemaMatches(schema =>
        includes(["domain_name", "domain-name"], (schema as any).semantic_type)
      )
    )
  )
};
</script>
