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
      :overridden="appliedOptions?.overridden"
      @update:modelValue="handleTermChange"
    />
  </FormField>
</template>

<script lang="ts" setup>
import { uiTypeIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { FormField, useUpmindUIRenderer } from "@upmind/ui";
import { computed, defineAsyncComponent } from "vue";
import { useI18n } from "vue-i18n";
import { useConfig } from "@upmind-automation/headless";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { TermDetails } from "@upmind-automation/headless";
const props = defineProps<RendererProps<ControlElement>>();
// --- external

// -----------------------------------------------------------------------------
// Lazy: a static import pulls the product module tree into every barrel consumer.
const TermsRadio = defineAsyncComponent(
  () => import("../components/terms/TermsRadio.vue")
);
const TermsSelect = defineAsyncComponent(
  () => import("../components/terms/TermsSelect.vue")
);

const { t } = useI18n();

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props));

const configMeta = useConfig()!;

const getTermsComponent = computed(() => {
  return configMeta.ui.termSelector.isSelect ? TermsSelect : TermsRadio;
});

const termItems = computed<TermDetails[]>(
  () => ((control.value.schema as any)?.options as TermDetails[]) ?? []
);

function handleTermChange(value: number) {
  onInput(value);
}
</script>

<script lang="ts">
export const tester = {
  rank: 5,
  controlType: uiTypeIs("Terms")
};
</script>
