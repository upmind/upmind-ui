<template>
  <div :class="styles.checkout.stored.root">
    <Form
      v-model="model"
      :processing="meta.isProcessing"
      :schema="props.schema"
      :uischema="props.uischema"
      no-actions
    />

    <!-- Errors and Feedback -->

    <Alert
      v-if="meta.hasErrors"
      color="warning"
      icon="alert-triangle"
      :title="t('text.payment_failed')"
    >
      <div class="mt-2 text-sm">
        <li class="my-0 py-0">
          {{ props.errors }}
        </li>
      </div>
    </Alert>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import config from "../checkout.config";
import { useStyles } from "@upmind-automation/upmind-ui";
import TermsAndConditions from "../../brand/TermsAndConditions.vue";

// --- components
import { Alert, Markdown, Button } from "@upmind-automation/upmind-ui";
import Form from "../../../components/form/Form.vue";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { StoredPaymentMethodProps } from "../types";

// -----------------------------------------------------------------------------
const props = defineProps<StoredPaymentMethodProps>();
const emit = defineEmits<{
  (e: "resolve"): void;
}>();

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

const styles = useStyles(["checkout", "checkout.stored"], meta, config);
</script>
