<template>
  <div :class="storedRootVariants()">
    <Form
      v-model="model"
      :processing="meta.isProcessing"
      :schema="schema"
      :uischema="uischema"
      no-actions
    />

    <!-- Errors and Feedback -->

    <Alert
      v-if="meta.hasErrors"
      variant="warning"
      :title="t('text.payment_failed')"
      :description="props.errors?.message"
    >
      <template #icon><Icon icon="alert-triangle" /></template>
    </Alert>
  </div>
</template>

<script lang="ts" setup>
import { Alert } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Form } from "@upmind-automation/foundation";
import { Icon } from "@upmind-automation/foundation";
import { storedRootVariants } from "../variants";
import type { StoredPaymentMethodProps } from "../types";

const model = defineModel("modelValue", {
  get(value) {
    return { payment_details_id: value };
  },
  set(value: { payment_details_id?: string }) {
    return value.payment_details_id;
  }
});

// -----------------------------------------------------------------------------
const props = defineProps<StoredPaymentMethodProps>();

const { t } = useI18n();

const meta = computed(() => {
  return {
    isProcessing: props.processing,
    hasErrors: !!props.errors
  };
});
</script>
