<template>
  <div :class="styles.payment.gateway">
    <Form
      v-model="model"
      :processing="meta.isProcessing"
      :schema="schema"
      :uischema="uischema"
      no-actions
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import Form from "../../../components/form/Form.vue";
import config from "../payment.config";
import type { PaymentGatewaysProps } from "../types";

// -----------------------------------------------------------------------------
const props = defineProps<PaymentGatewaysProps>();

const model = defineModel("modelValue", {
  get(value) {
    return { gateway_id: value };
  },
  set(value: { gateway_id?: string }) {
    return value.gateway_id;
  }
});

const meta = computed(() => {
  return {
    isProcessing: props.processing
  };
});

const styles = useStyles(
  ["payment", "payment.accordion", "payment.accordion.trigger"],
  meta,
  config
);
</script>
