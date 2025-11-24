<template>
  <UpmSection :label="t('text.personal_details')">
    <i18n-t keypath="text.personal_details_msg" tag="h1" />

    <!-- v-show="uischema.showFieldsOnCheckout" -->
    <!-- Additional Options -->
    <pre>{{ meta }}</pre>

    <Alert v-if="!meta.isAvailable" type="error" class="mb-4">
      <pre>{{ errors }}</pre>
    </Alert>

    <Form
      v-if="!meta.isLoading"
      :additional-errors="errors?.data"
      :model-value="model"
      :schema="schema"
      :uischema="uischema"
      :touched="meta.showErrors"
      @reject="clear"
      @resolve="update"
      @update:modelValue="input"
    />
    <!--
    <pre>{{ schema }}</pre>
    <pre>{{ uischema }}</pre> -->
    <pre>{{ model }}</pre>
  </UpmSection>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { computed } from "vue";
// import { useRouter } from "vue-router";

// --- internal
import { useProfileFieldsManager } from "@upmind-automation/headless";

// --- components
import { UpmSection } from "@upmind-automation/client-vue";
import { Form, Alert } from "@upmind-automation/upmind-ui";

// --- types
import type { FormActionProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const props = defineProps<{ fields: string[] }>();

const { t } = useI18n();

const {
  errors,
  meta,
  model,
  schema,
  uischema,
  update,
  input,
  clear,
  isReady
  // edit: doEdit
} = useProfileFieldsManager({
  filterFields: props.fields
});

const actions = computed((): Record<string, FormActionProps> => {
  return {
    submit: {
      type: "submit" as "submit",
      label: t("action.apply"),
      size: "lg",
      variant: "subtle",
      needsValid: true
    }
  };
});

await isReady();
</script>
