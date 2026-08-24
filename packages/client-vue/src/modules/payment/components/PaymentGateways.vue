<template>
  <!-- NB: parity with the retired useStyles output — `styles.payment.gateway`
       resolved to the no-op literal "root form" (the gateway cva object was
       never path-requested here), so no gateway styling is applied. -->
  <div class="root form">
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
import Form from "../../../components/form/Form.vue";
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
</script>
