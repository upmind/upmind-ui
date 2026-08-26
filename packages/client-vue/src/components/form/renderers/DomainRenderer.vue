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
      :errors="castArray(formFieldProps.errors ?? [])"
      :touched="formFieldProps.touched"
      @update:modelValue="onDomainInput"
    />
  </FormField>
</template>

<script lang="ts" setup>
import { uiTypeIs, and, optionIs, or, schemaMatches } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { useI18n } from "vue-i18n";
import SmartDomainField from "../../../modules/domain/SmartDomainField.vue";
import FormField from "../engine/FormField.vue";
import { useUpmindUIRenderer } from "../engine/renderers/utils";
import { castArray, includes, trim } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// --- external

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { t } = useI18n();

const { control, formFieldProps, onInput, handleChange } = useUpmindUIRenderer(
  useJsonFormsControl(props),
  (value: unknown) => trim(String(value))
);

const onDomainInput = (value: string | null, isTouched = true) => {
  if (!value) return handleChange(control.value.path, undefined);
  onInput(value, isTouched);
};
</script>

<script lang="ts">
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
