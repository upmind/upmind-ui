<template>
  <FormField v-bind="formFieldProps" :optional-text="t('text.optional')">
    <Domain
      :template="DOMAIN_TEMPLATE.DRAWER"
      :model-value="control.data"
      :touched="formFieldProps.touched"
      :required="formFieldProps.required"
      @update:modelValue="onInput"
      @update:type="resetInput"
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

const { t } = useI18n();
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
