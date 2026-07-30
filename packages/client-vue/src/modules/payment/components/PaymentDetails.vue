<template>
  <Section
    id="payment-details"
    value="payment-details"
    :icon="sectionIcon"
    :label="sectionLabel"
    :dataAttrs="payAmountDataAttrs"
    :disabled="props.disabled"
  >
    <template #actions>
      <PaymentAmount
        v-if="!meta.isFree && meta.canMakePartialPayment"
        :amount="amount"
        :amountsFormatted="amountsFormatted"
        :processing="meta.isProcessing"
        :modelValue="model?.amount"
        :currency="currency"
        :schema="schemaAmount"
        :uischema="uischemaAmount"
        @update:modelValue="setAmount"
        @reject="resetPartialAmount"
      />
    </template>

    <Loading :active="meta.isLoading" :class="styles.payment.root">
      <slot name="prepend" />

      <!-- Free -->
      <PaymentNotRequired
        v-if="meta.isAvailable && meta.isFree && !meta.needsPayment"
        :free="meta.isFree"
        :processing="meta.isProcessing"
        :hasErrors="meta.hasErrors"
        :payOffline="meta.isPayOffline"
        @resolve="doResolve"
      />

      <!-- Needs Payment -->
      <template v-if="meta.showPaymentSection">
        <!-- Account Credit -->
        <AccountCredit
          v-if="meta.hasAccountCredit"
          :processing="meta.isProcessing"
          :modelValue="model?.wallet_amount ?? 0"
          :amount="model?.amount ?? 0"
          :amounts-formatted="amountsFormatted"
          :accountCredit="accountCredit!"
          :currency="currency"
          :schema="schemaAmountCredit"
          :uischema="uischemaAmountCredit"
          @update:modelValue="setAmountCredit"
        />

        <!-- Stored Payments -->
        <StoredPaymentMethods
          v-if="meta.showStoredPaymentMethods"
          :errors="errors"
          :processing="meta.isProcessing"
          :schema="schemaStoredPaymentMethods"
          :uischema="uischemaStoredPaymentMethods"
          :modelValue="model?.payment_details_id"
          @update:modelValue="setStoredPaymentMethod"
        />

        <!-- Payment Error (shown when no gateway is active to display it) -->
        <Alert
          v-if="paymentError && !meta.hasSelectedGateway"
          color="danger"
          variant="minimal"
          icon="alert-triangle"
          :title="t('text.payment_failed')"
          :description="paymentError"
          :dataAttrs="{ 'data-test-key': 'payment-error-alert' }"
        />

        <!-- Selected Payment Gateway -->
        <PaymentGateway
          v-if="meta.hasSelectedGateway"
          :key="model!.gateway_id"
          :error="paymentError"
          :single-gateway="meta.hasSingleGateway"
          @cancel="setGateway(null)"
        />

        <PayLater v-else-if="meta.isPayLater" @cancel="clear" />

        <PaymentActions
          v-if="meta.showPaymentActions"
          :disabled="meta.hasSelectedGateway && !meta.isValid"
          :free="!meta.isPayContext || meta.isFree"
          :offline="meta.isPayOffline"
          :processing="meta.isProcessing || processing"
          :clickwrap="clickwrap"
          :settlement="meta.isSettlement"
          @resolve="doResolve"
        />

        <!-- Payment Gateways selection -->
        <PaymentGateways
          v-if="meta.showGatewaySelection"
          :processing="meta.isProcessing"
          :modelValue="model?.gateway_id"
          :schema="schemaGateways"
          :uischema="uischemaGateways"
          @update:modelValue="setGateway"
        />

        <!-- No Gateways Available -->
        <PaymentGatewaysUnavailable
          v-if="meta.needsPayment && !meta.hasGateways"
          :clickwrap="clickwrap"
          :currencyCode="currency?.code"
          :countryName="address?.country?.name"
          :processing="meta.isProcessing"
          @resolve="doResolve"
        />

        <slot name="append" />
      </template>
    </Loading>
  </Section>
</template>

<script lang="ts" setup>
import { computed, inject } from "vue";
import { useI18n } from "vue-i18n";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  type UsePaymentDetail
} from "@upmind-automation/headless";
import { Alert, Loading, useStyles } from "@upmind-automation/upmind-ui";
import Section from "../../../components/section/Section.vue";
import config from "../payment.config";
import AccountCredit from "./AccountCredit.vue";
import PayLater from "./PayLater.vue";
import PaymentActions from "./PaymentActions.vue";
import PaymentAmount from "./PaymentAmount.vue";
import PaymentGateway from "./PaymentGateway.vue";
import PaymentGateways from "./PaymentGateways.vue";
import PaymentGatewaysUnavailable from "./PaymentGatewaysUnavailable.vue";
import PaymentNotRequired from "./PaymentNotRequired.vue";
import StoredPaymentMethods from "./StoredPaymentMethods.vue";
import type { PaymentDetailsProps } from "../types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<PaymentDetailsProps>(), {
  as: "div",
  class: "bg-surface"
});

const emit = defineEmits<{
  resolve: [];
}>();

const { t } = useI18n();

const styles = useStyles(["payment"], {}, config);

const paymentDetail = inject<UsePaymentDetail>("usePaymentDetail");

if (!paymentDetail)
  throw new DetailedError(
    t("error.payment_detail_not_available"),
    responseCodes.Service_Unavailable,
    ErrorOrigin.Headless
  );

const {
  accountCredit,
  address,
  amount,
  amountsFormatted,
  clear,
  clickwrap,
  currency,
  errors,
  meta,
  model,
  resetPartialAmount,
  schemaAmount,
  schemaAmountCredit,
  schemaGateways,
  schemaStoredPaymentMethods,
  setAmount,
  setAmountCredit,
  setGateway,
  setStoredPaymentMethod,
  uischemaAmount,
  uischemaAmountCredit,
  uischemaGateways,
  uischemaStoredPaymentMethods
} = paymentDetail;

const sectionIcon = computed(
  () =>
    props.icon ?? (meta.value.isPayContext ? "wallet-02" : "credit-card-plus")
);

const sectionLabel = computed(
  () =>
    props.label ??
    (meta.value.isPayContext
      ? t("cart.payment_details", { amount: amountsFormatted?.value?.amount })
      : t("cart.add_payment_method"))
);

const payAmountDataAttrs = computed(() => {
  const amount = amountsFormatted?.value?.amount;
  if (!meta.value.isPayContext || !amount) return undefined;

  return {
    "data-test-key": "pay-amount-value",
    "data-test-value": amount
  };
});

const paymentError = computed(() => errors?.value?.message || props.error);

async function doResolve() {
  emit("resolve");
}
</script>
