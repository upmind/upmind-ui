<template>
  <FormField
    v-bind="formFieldProps"
    :errors="defaultsDeep(formFieldProps.errors, domainErrors)"
    :optional-text="t('text.optional')"
  >
    <Domain
      :template="DOMAIN_TEMPLATE.DRAWER"
      :model-value="control.data"
      :touched="formFieldProps.touched"
      :required="formFieldProps.required"
      :disabled="formFieldProps.disabled"
      @update:modelValue="onInput"
      @update:type="resetInput"
      @error="onError"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { useJsonFormsControl } from "@jsonforms/vue";
import { useI18n } from "vue-i18n";

// --- components
import { FormField } from "@upmind-automation/upmind-ui";
import Domain from "../../../modules/domain/Domain.vue";

// --- utils
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import { DOMAIN_TEMPLATE } from "../../../modules/domain/types";

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();
const domainErrors = ref<string[]>([]);

const { t } = useI18n();

const { control, formFieldProps, onInput } = useUpmindUIRenderer(
  useJsonFormsControl(props),
  (value: string) => trim(value)
);

const resetInput = (value?: string) => {
  onInput(value, false);
};

const onError = (error: string) => {
  domainErrors.value = error ? [error] : [];
};
</script>

<script lang="ts">
import { uiTypeIs, and, optionIs, or, schemaMatches } from "@jsonforms/core";
import { defaultsDeep, includes, trim } from "lodash-es";
import { ref } from "vue";

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
