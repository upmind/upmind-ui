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
    >
      <template #icon><Icon icon="alert-triangle" /></template>
      <div class="mt-2 text-sm">
        <li class="my-0 py-0">
          {{ props.errors }}
        </li>
      </div>
    </Alert>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Alert } from "@upmind/ui";
import Form from "../../../components/form/Form.vue";
import { Icon } from "../../../components/icon";
import { storedRootVariants } from "../variants";
import type { StoredPaymentMethodProps } from "../types";

// -----------------------------------------------------------------------------
const props = defineProps<StoredPaymentMethodProps>();

const model = defineModel("modelValue", {
  get(value) {
    return { payment_details_id: value };
  },
  set(value: { payment_details_id?: string }) {
    return value.payment_details_id;
  }
});

const { t } = useI18n();

const meta = computed(() => {
  return {
    isProcessing: props.processing,
    hasErrors: !!props.errors
  };
});
</script>
