<template>
  <FormField v-bind="formFieldProps" :optional-text="t('text.optional')">
    <component
      :is="getTermsComponent"
      as="div"
      :items="termItems"
      :model-value="control.data"
      :errors="formFieldProps.errors"
      :touched="formFieldProps.touched"
      :required="formFieldProps.required"
      :disabled="formFieldProps.disabled"
      :type="configMeta.ui.termSelector.value"
      :columns="configMeta.ui.termSelectorGrid.asNumber"
      :summary="configMeta.ui.termSelectorSummary.isVisible"
      @update:modelValue="handleTermChange"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { useJsonFormsControl } from "@jsonforms/vue";
import { useI18n } from "vue-i18n";
import { computed } from "vue";

// --- components
import { FormField } from "@upmind-automation/upmind-ui";
import TermsConfigRadio from "../../../modules/product/components/terms/TermsConfigRadio.vue";
import TermsConfigSelect from "../../../modules/product/components/terms/TermsConfigSelect.vue";

// --- utils
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";
import { useConfig } from "@upmind-automation/headless";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { TermDetails } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();
const { t } = useI18n();

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props));

const configMeta = useConfig()!;

const getTermsComponent = computed(() => {
  return configMeta.ui.termSelector.isSelect
    ? TermsConfigSelect
    : TermsConfigRadio;
});

const termItems = computed<TermDetails[]>(
  () => ((control.value.schema as any)?.options as TermDetails[]) ?? []
);

function handleTermChange(value: number) {
  onInput(value);
}
</script>

<script lang="ts">
import { uiTypeIs } from "@jsonforms/core";

export const tester = {
  rank: 5,
  controlType: uiTypeIs("Terms")
};
</script>
