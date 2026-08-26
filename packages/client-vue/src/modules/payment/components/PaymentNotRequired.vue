<template>
  <!-- NB: parity with the retired useStyles output — `styles.payment.gateway`
       resolved to the no-op literal "root form" (the gateway cva object was
       never path-requested here), so no gateway styling is applied. -->
  <div class="root form">
    <Alert
      variant="success"
      appearance="outline"
      :title="t('cart.nothing_to_pay_msg')"
      :description="t('cart.place_order_desc')"
      :dataAttrs="{ 'data-test-key': 'free-order-banner' }"
    >
      <template #icon><Icon icon="check-circle" /></template>
    </Alert>
  </div>

  <PaymentActions
    :free="free"
    :processing="processing"
    :disabled="processing"
    :errors="hasErrors"
    :offline="payOffline"
    @resolve="handleCheckout"
  />
</template>

<script lang="ts" setup>
import { Alert } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { Icon } from "../../../components/icon";
import PaymentActions from "./PaymentActions.vue";
import type { PaymentNotRequiredProps } from "../types";

// -----------------------------------------------------------------------------
defineProps<PaymentNotRequiredProps>();
const emit = defineEmits<{
  (e: "resolve"): void;
}>();

const { t } = useI18n();

const handleCheckout = () => {
  emit("resolve");
};
</script>
