<template>
  <FormField
    v-bind="formFieldProps"
    :optional-text="t('text.optional')"
    no-errors
  >
    <SmartDomainField
      :model-value="control.data"
      :required="formFieldProps.required"
      :disabled="formFieldProps.disabled"
      :errors="formFieldProps.errors"
      :touched="formFieldProps.touched"
      @update:modelValue="onDomainInput"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { useJsonFormsControl } from "@jsonforms/vue";
import { useI18n } from "vue-i18n";

// --- components
import { FormField } from "@upmind-automation/upmind-ui";
import SmartDomainField from "../../../modules/domain/SmartDomainField.vue";

// --- utils
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { t } = useI18n();

const { control, formFieldProps, onInput, handleChange } = useUpmindUIRenderer(
  useJsonFormsControl(props),
  (value: string) => trim(value)
);

const onDomainInput = (value: any, isTouched = true) => {
  // Skip emits null — convert to undefined to remove the property from form data,
  // bypassing onInput's isNil guard.
  if (value === null) return handleChange(control.value.path, undefined);
  onInput(value, isTouched);
};
</script>

<script lang="ts">
import { uiTypeIs, and, optionIs, or, schemaMatches } from "@jsonforms/core";
import { includes, trim } from "lodash-es";

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
