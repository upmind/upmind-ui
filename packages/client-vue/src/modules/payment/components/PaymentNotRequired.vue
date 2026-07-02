<template>
  <div :class="styles.payment.gateway">
    <Alert
      variant="minimal"
      icon="check-circle"
      :title="t('cart.nothing_to_pay_msg')"
      :description="t('cart.place_order_desc')"
      :dataAttrs="{ 'data-test-key': 'free-order-banner' }"
    />
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
import { useI18n } from "vue-i18n";
import { useStyles } from "@upmind-automation/upmind-ui";
import { Alert } from "@upmind-automation/upmind-ui";
import config from "../payment.config";
import PaymentActions from "./PaymentActions.vue";
import type { PaymentNotRequiredProps } from "../types";

// -----------------------------------------------------------------------------
const _props = defineProps<PaymentNotRequiredProps>();
const emit = defineEmits<{
  (e: "resolve"): void;
}>();

const { t } = useI18n();

const styles = useStyles(["payment", "payment.footer"], {}, config);

const handleCheckout = () => {
  emit("resolve");
};
</script>
