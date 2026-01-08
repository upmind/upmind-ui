<template>
  <div :class="styles.checkout.gateway">
    <Alert
      variant="minimal"
      icon="check-circle"
      :title="t('cart.nothing_to_pay_msg')"
      :description="t('cart.place_order_desc')"
    />
  </div>

  <PaymentActions
    :free="meta.isFree"
    :processing="meta.isProcessing"
    :disabled="meta.isProcessing"
    :errors="meta.hasErrors"
    :offline="meta.isPayOffline"
    @resolve="handleCheckout"
  />
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useBasketPaymentDetails } from "@upmind-automation/headless";
import config from "../checkout.config";
import { useStyles } from "@upmind-automation/upmind-ui";
import PaymentActions from "./PaymentActions.vue";

// --- components
import { Alert } from "@upmind-automation/upmind-ui";

// --- utils

// --- types
import type { PaymentGatewayProps } from "../types";

// -----------------------------------------------------------------------------
const props = defineProps<PaymentGatewayProps>();
const emit = defineEmits<{
  (e: "resolve"): void;
}>();

const { meta } = useBasketPaymentDetails();

const { t } = useI18n();

const styles = useStyles(["checkout", "checkout.footer"], meta, config);

const handleCheckout = () => {
  emit("resolve");
};

// --- side effects
</script>
