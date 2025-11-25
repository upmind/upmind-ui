<template>
  <div :class="styles.checkout.gateway">
    <Form
      v-model="model"
      :processing="meta.isProcessing"
      :schema="props.schema"
      :uischema="props.uischema"
      no-actions
    />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { type ComputedRef, computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal

import config from "../checkout.config";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- components
import Form from "../../../components/form/Form.vue";

// --- types
import type { PaymentGatewaysProps } from "../types";

// -----------------------------------------------------------------------------
const props = defineProps<PaymentGatewaysProps>();
const emit = defineEmits<{
  (e: "resolve"): void;
}>();

const model = defineModel("modelValue", {
  get(value) {
    return { gateway_id: value };
  },
  set(value: { gateway_id?: string }) {
    return value.gateway_id;
  }
});

const { t } = useI18n();

const meta = computed(() => {
  return {
    isProcessing: props.processing
  };
});

const styles = useStyles(
  ["checkout", "checkout.accordion", "checkout.accordion.trigger"],
  meta,
  config
) as ComputedRef<{
  checkout: {
    gateway: string;
    content: string;
    footer: {
      root: string;
      actions: string;
      terms: string;
    };
    action: string;
    additional: string;
    terms: string;
    clickwrap: string;
  };
}>;

// --- methods

function onResolve() {
  emit("resolve");
}

// --- side effects
</script>
